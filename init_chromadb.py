# init_chromadb.py - Tag Careers & Index in ChromaDB
import os
import json
from core.constants import RIASEC_KEYWORDS
from modules.vector_store import vector_store

def run_migration():
    print("[MIGRATION] Starting RIASEC tagging and ChromaDB initialization...")
    
    # Path to Data.json
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    data_json_path = os.path.join(backend_dir, "Data.json")
    
    if not os.path.exists(data_json_path):
        print(f"[ERROR] Data.json not found at {data_json_path}")
        return
        
    with open(data_json_path, "r", encoding="utf-8") as f:
        careers_data = json.load(f)
        
    careers = careers_data.get("careers", [])
    print(f"[MIGRATION] Loaded {len(careers)} raw careers from Data.json.")
    
    # Flatten and normalize nested careers format
    normalized_careers = []
    for c in careers:
        if "career" in c and isinstance(c["career"], dict):
            nested = c["career"]
            flat = {}
            for k, v in nested.items():
                flat[k] = v
            if "name" in nested:
                flat["career_name"] = nested["name"]
            if "riasec_tags" in c:
                flat["riasec_tags"] = c["riasec_tags"]
            normalized_careers.append(flat)
        else:
            if "career_name" not in c and "name" in c:
                c["career_name"] = c["name"]
            normalized_careers.append(c)
    careers = normalized_careers
    print(f"[MIGRATION] Normalized {len(careers)} careers into standard flat structure.")
    
    # Step 1: Tag careers with explicit RIASEC codes based on keyword search
    tagged_count = 0
    for career in careers:
        career_name = career.get("career_name", "")
        desc = career.get("description", "").lower()
        traits = " ".join(career.get("personality_traits", [])).lower()
        full_text = f"{career_name.lower()} {desc} {traits}"
        
        # Calculate matching scores for each RIASEC letter
        scores = {}
        for code, keywords in RIASEC_KEYWORDS.items():
            match_score = 0
            for keyword in keywords:
                if keyword.lower() in full_text:
                    match_score += 1
            scores[code] = match_score
            
        # Get top 3 RIASEC letters with score > 0
        sorted_codes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_tags = [code for code, score in sorted_codes if score > 0][:3]
        
        # Fallback if no keywords matched: default to investigative and enterprising
        if not top_tags:
            top_tags = ["I", "E", "R"]
            
        career["riasec_tags"] = top_tags
        tagged_count += 1
        
    # Write tagged careers back to Data.json
    with open(data_json_path, "w", encoding="utf-8") as f:
        json.dump({"careers": careers}, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Successfully tagged {tagged_count} careers with explicit RIASEC tags in Data.json.")
    
    # Step 2: Index careers in ChromaDB Vector Store
    if vector_store.enabled:
        print("[MIGRATION] Indexing careers in ChromaDB collection...")
        vector_store.add_careers(careers)
        print("[SUCCESS] ChromaDB indexing complete.")
    else:
        print("[WARNING] ChromaDB is disabled or dependencies not installed. Skipping indexing.")
        
    # Step 3: Seed careers in SQLite relational table
    from modules.conversation_memory import conversation_memory
    print("[MIGRATION] Seeding careers database in SQLite...")
    conversation_memory.upsert_careers(careers)
    print("[SUCCESS] SQLite career seeding complete.")

if __name__ == "__main__":
    run_migration()
