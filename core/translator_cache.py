import os
import json
import sqlite3
import hashlib
from deep_translator import GoogleTranslator

# Get absolute path to the database relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DB = os.path.join(BASE_DIR, 'database', 'translation_cache.db')

def init_cache_db():
    os.makedirs(os.path.dirname(CACHE_DB), exist_ok=True)
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS translations (
            hash_key TEXT PRIMARY KEY,
            source_text TEXT,
            target_lang TEXT,
            translated_text TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the cache DB when the module is imported
init_cache_db()

def get_cached_translation(text, target_lang):
    if not text or not isinstance(text, str) or not text.strip():
        return text
        
    if target_lang == 'en':
        return text
        
    # Create a unique hash for the text and language
    hash_key = hashlib.md5(f"{target_lang}:{text}".encode('utf-8')).hexdigest()
    
    conn = sqlite3.connect(CACHE_DB)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT translated_text FROM translations WHERE hash_key = ?", (hash_key,))
        row = cursor.fetchone()
        
        if row:
            return row[0]
            
        # If not cached, translate it
        try:
            translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
            if translated:
                cursor.execute("INSERT OR REPLACE INTO translations (hash_key, source_text, target_lang, translated_text) VALUES (?, ?, ?, ?)",
                               (hash_key, text, target_lang, translated))
                conn.commit()
                return translated
        except Exception as e:
            print(f"[WARN] Google Translator failed ({str(e)[:50]}), attempting LLM fallback...")
            try:
                # Fallback to LLM translation if Google fails (e.g. TooManyRequests)
                from modules.llm_engine import nova
                lang_name = 'Marathi' if target_lang == 'mr' else 'Hindi' if target_lang == 'hi' else target_lang
                
                prompt = f"Translate the following text into {lang_name}. Output ONLY the exact translation and nothing else. No explanation, no quotes unless in the original.\n\nText: {text}"
                translated = nova.generate_response(prompt=prompt, system_prompt="You are a professional, accurate translator.", max_tokens=1500)
                
                # Check if we got a valid response and it's not the default error message
                if translated and "🚨" not in translated:
                    translated = translated.strip(' \n"')
                    cursor.execute("INSERT OR REPLACE INTO translations (hash_key, source_text, target_lang, translated_text) VALUES (?, ?, ?, ?)",
                                   (hash_key, text, target_lang, translated))
                    conn.commit()
                    return translated
            except Exception as llm_e:
                print(f"[WARN] LLM fallback translation failed: {str(llm_e)[:50]}...")
            
    finally:
        conn.close()
        
    return text # Fallback to original text if translation fails

def translate_career_data(career, lang):
    """Deeply translates a career dictionary into the specified language."""
    if not career or not isinstance(career, dict) or lang == 'en':
        return career
        
    # Attempt bulk LLM translation first for efficiency
    try:
        import hashlib
        career_json_str = json.dumps(career, sort_keys=True)
        hash_key = hashlib.md5(f"bulk_career_{lang}:{career_json_str}".encode('utf-8')).hexdigest()
        
        conn = sqlite3.connect(CACHE_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT translated_text FROM translations WHERE hash_key = ?", (hash_key,))
        row = cursor.fetchone()
        
        if row:
            conn.close()
            return json.loads(row[0])
            
        from modules.llm_engine import nova
        lang_name = 'Marathi' if lang == 'mr' else 'Hindi' if lang == 'hi' else lang
        
        prompt = f"""You are an expert technical translator. Translate ALL string values in this JSON object into {lang_name}.
DO NOT translate any JSON keys. DO NOT translate URLs, file paths, or image names.
Return ONLY valid JSON and nothing else. Do not use markdown formatting blocks.

{json.dumps(career, ensure_ascii=False)}"""

        translated_text = nova.generate_response(prompt=prompt, system_prompt="You are a JSON translator. Output strictly valid JSON.", max_tokens=3500)
        
        if translated_text and "🚨" not in translated_text:
            translated_text = translated_text.strip(' \n`')
            if translated_text.lower().startswith('json'):
                translated_text = translated_text[4:].strip()
                
            translated_obj = json.loads(translated_text)
            cursor.execute("INSERT OR REPLACE INTO translations (hash_key, source_text, target_lang, translated_text) VALUES (?, ?, ?, ?)",
                           (hash_key, "bulk_career", lang, json.dumps(translated_obj, ensure_ascii=False)))
            conn.commit()
            conn.close()
            return translated_obj
    except Exception as e:
        print(f"[WARN] Bulk LLM translation failed for career {career.get('name')}: {e}")
        try:
            conn.close()
        except:
            pass
            
    # Fallback to string-by-string
    translated = dict(career)
    
    # Translate top-level simple strings
    if 'name' in translated:
        translated['name'] = get_cached_translation(translated['name'], lang)
    if 'reason' in translated:
        translated['reason'] = get_cached_translation(translated['reason'], lang)
    if 'career_name' in translated:
        translated['career_name'] = get_cached_translation(translated['career_name'], lang)
    
    # Translate top-level lists
    if 'strengths' in translated and isinstance(translated['strengths'], list):
        translated['strengths'] = [get_cached_translation(s, lang) for s in translated['strengths']]
    if 'improvement_areas' in translated and isinstance(translated['improvement_areas'], list):
        translated['improvement_areas'] = [get_cached_translation(s, lang) for s in translated['improvement_areas']]
    if 'riasec_tags' in translated and isinstance(translated['riasec_tags'], list):
        translated['riasec_tags'] = [get_cached_translation(s, lang) for s in translated['riasec_tags']]
        
    # Translate detailed data field
    if 'data' in translated and isinstance(translated['data'], dict):
        t_data = dict(translated['data'])
        
        for field in ['overview', 'future_outlook', 'work_environment', 'description']:
            if field in t_data and isinstance(t_data[field], str):
                t_data[field] = get_cached_translation(t_data[field], lang)
                
        for field in ['skills', 'education', 'certifications', 'top_employers', 'related_careers']:
            if field in t_data and isinstance(t_data[field], list):
                t_data[field] = [get_cached_translation(item, lang) if isinstance(item, str) else item for item in t_data[field]]
                
        if 'salary' in t_data and isinstance(t_data['salary'], dict):
            t_salary = dict(t_data['salary'])
            if 'details' in t_salary:
                t_salary['details'] = get_cached_translation(t_salary['details'], lang)
            t_data['salary'] = t_salary
            
        translated['data'] = t_data
        
    if 'career_data' in translated and isinstance(translated['career_data'], dict):
        t_data = dict(translated['career_data'])
        for field in ['overview', 'future_outlook', 'work_environment', 'description']:
            if field in t_data and isinstance(t_data[field], str):
                t_data[field] = get_cached_translation(t_data[field], lang)
        for field in ['skills', 'education', 'certifications']:
            if field in t_data and isinstance(t_data[field], list):
                t_data[field] = [get_cached_translation(item, lang) if isinstance(item, str) else item for item in t_data[field]]
        translated['career_data'] = t_data
        
    return translated

def translate_teaser_data(teaser, lang):
    """Translates assessment teaser data."""
    if not teaser or not isinstance(teaser, dict) or lang == 'en':
        return teaser
        
    translated = dict(teaser)
    if 'primary_career_title' in translated:
        translated['primary_career_title'] = get_cached_translation(translated['primary_career_title'], lang)
    if 'teaser_headline' in translated:
        translated['teaser_headline'] = get_cached_translation(translated['teaser_headline'], lang)
    if 'teaser_subheadline' in translated:
        translated['teaser_subheadline'] = get_cached_translation(translated['teaser_subheadline'], lang)
    if 'career_status' in translated:
        translated['career_status'] = get_cached_translation(translated['career_status'], lang)
    if 'included_features' in translated and isinstance(translated['included_features'], list):
        translated['included_features'] = [get_cached_translation(f, lang) for f in translated['included_features']]
        
    return translated
