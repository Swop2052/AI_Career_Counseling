# modules/llm_engine.py - Enhanced Nova LLM Engine
import os
import re
import json
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from core.config import config
from core.exceptions import LLMError

# Load environment variables
load_dotenv()

# --- MONKEYPATCH HTTPX FOR COMPATIBILITY ---
try:
    import httpx
    # Prevent TypeError: Client.__init__() got an unexpected keyword argument 'proxies' in httpx >= 0.28.0
    original_client_init = httpx.Client.__init__
    def custom_client_init(self, *args, **kwargs):
        if "proxies" in kwargs:
            proxies = kwargs.pop("proxies")
            if proxies and isinstance(proxies, dict) and "http://" in proxies:
                kwargs["proxy"] = proxies["http://"]
        original_client_init(self, *args, **kwargs)
    httpx.Client.__init__ = custom_client_init

    original_async_client_init = httpx.AsyncClient.__init__
    def custom_async_client_init(self, *args, **kwargs):
        if "proxies" in kwargs:
            proxies = kwargs.pop("proxies")
            if proxies and isinstance(proxies, dict) and "http://" in proxies:
                kwargs["proxy"] = proxies["http://"]
        original_async_client_init(self, *args, **kwargs)
    httpx.AsyncClient.__init__ = custom_async_client_init
    print("[SUCCESS] Successfully applied httpx client proxies monkeypatch")
except Exception as e:
    print(f"[INFO] httpx monkeypatch not applied or not needed: {e}")


class NovaEngine:
    """
    VERA - AI Career Companion with conversation memory and intent awareness.
    Provides context-aware, natural responses with fallback capability.
    """
    
    def __init__(self):
        self.api_key = config.anthropic_api_key
        self.model = config.llm_model
        self.max_tokens = config.llm_max_tokens
        self.temperature = config.llm_temperature
        self.top_p = config.llm_top_p
        
        self._client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Anthropic client."""
        if not self.api_key:
            print("[WARNING] WARNING: ANTHROPIC_API_KEY not found in .env file!")
            return
        
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self.api_key)
            print("[SUCCESS] VERA LLM Engine initialized with Anthropic")
        except ImportError:
            print("[WARNING] WARNING: anthropic package not installed!")
        except Exception as e:
            print(f"[WARNING] WARNING: Failed to initialize Anthropic client: {e}")

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        intent: Optional[str] = None
    ) -> str:
        """
        Generate a response using the LLM (Anthropic) with static fallback.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system instructions
            temperature: Optional temperature override
            max_tokens: Optional max tokens override
            intent: Optional classified intent
            
        Returns:
            Generated response
        """
        # Try Anthropic if client is available
        if self._client:
            try:
                system = system_prompt or self._get_system_prompt()
                temp = temperature if temperature is not None else self.temperature
                max_tok = max_tokens if max_tokens is not None else self.max_tokens
                
                # claude-sonnet-4-6 does not allow specifying both temperature and top_p.
                # We prioritize temperature for controlling randomness.
                params = {
                    "model": self.model,
                    "max_tokens": max_tok,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}]
                }
                if temp is not None:
                    params["temperature"] = temp
                elif self.top_p is not None:
                    params["top_p"] = self.top_p

                response = self._client.messages.create(**params)
                print("[SUCCESS] Response generated successfully via Anthropic Client!")
                return response.content[0].text
                
            except Exception as e:
                print(f"[ERROR] Anthropic LLM Engine Error: {e}")
        
        # Fallback if Anthropic fails or is unconfigured
        return self._get_fallback_response(prompt, intent=intent)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for VERA."""
        return """You are VERA, a professional, warm, and encouraging AI Career Companion (similar to ChatGPT). 

Your goal is to have natural, open conversations with students, understand their context, and guide them towards their best career pathways.

GUIDELINES:
- **ChatGPT-Style Openness**: Feel free to answer ANY general questions, explain concepts, provide study tips, or discuss general topics. Be a conversational partner and do not reject general questions or greetings.
- **Reference Career Data (Data.json)**: When the student asks for specific factual details about a career (such as course fees, required entrance exams, target colleges, growth paths, or salaries), you MUST refer to the provided career database (Data.json information injected in the prompt) as your primary reference to guide them accurately.
- **Anti-Hallucination & Accuracy**: Do NOT invent or make up specific numbers (like salaries or fees) or exams if they are not in the database. If specific factual metrics for a career are missing from the provided data, say honestly: "I don't have those specific figures in my career database, but generally..." and use your broad general knowledge to guide them without misleading.
- **Conversational Tone**: Use emojis, address the student by name when available, be encouraging, and keep the interaction engaging and supportive. Help them explore their matches!"""
    
    def _get_fallback_response(self, prompt: str, intent: Optional[str] = None) -> str:
        """Generate a smart, content-aware fallback response from the SQLite database."""
        # Extract student name
        name = "Student"
        if "Name:" in prompt:
            lines = prompt.split("\n")
            for line in lines:
                if line.strip().startswith("Name:"):
                    name = line.split("Name:")[1].strip()
                    break
        
        # Extract user message
        user_message = ""
        if "=== STUDENT'S QUESTION ===" in prompt:
            parts = prompt.split("=== STUDENT'S QUESTION ===")
            if len(parts) > 1:
                user_message = parts[1].strip().split("\n")[0].strip()
        
        # Check if the user is introducing themselves in fallback mode
        user_msg_lower = user_message.lower().strip()
        intro_match = re.search(r"\bmy name is\s+([a-zA-Z\s]+)", user_msg_lower)
        if not intro_match:
            intro_match = re.search(r"\bi am\s+([a-zA-Z\s]+)", user_msg_lower)
            
        if intro_match:
            extracted_name = intro_match.group(1).strip().title()
            first_name = extracted_name.split()[0]
            matched_careers = []
            try:
                from modules.conversation_memory import conversation_memory
                all_careers = conversation_memory.get_all_careers()
                matched_careers = [c.get("career_name") for c in all_careers[:3]]
            except Exception:
                pass
            return f"""👋 Nice to meet you, {first_name}! I'm VERA, your AI Career Companion. [STARTUP]

I'm running in local fallback mode because I couldn't reach the Claude API, but I can still help you with your career journey!

Try asking me:
- **"What are my career matches?"**
- **"Tell me about [career name]"** (e.g. *"Tell me about {matched_careers[0] if matched_careers else 'Software Developer'}*" or any of your matched careers)
- **"Which colleges should I target?"**"""
        
        # Extract intent
        if intent:
            intent_str = intent.value if hasattr(intent, "value") else str(intent)
        else:
            intent_str = "general_chat"
        intent_str = intent_str.lower().strip()
        if "." in intent_str:
            intent_str = intent_str.split(".")[-1]
            
        if intent_str in ["none", "general_chat"]:
            if "Intent:" in prompt:
                lines = prompt.split("\n")
                for line in lines:
                    if line.strip().startswith("Intent:"):
                        intent_str = line.split("Intent:")[1].strip().lower()
                        break
        
        # Check if there are career matches
        has_careers = "AVAILABLE CAREERS" in prompt and "|" in prompt
        
        # Search SQLite database to see if user is asking about a specific career
        from modules.conversation_memory import conversation_memory
        
        # Load all valid careers from SQLite to check for matching mentions
        all_careers = []
        try:
            all_careers = conversation_memory.get_all_careers()
        except Exception:
            pass
            
        mentioned_career = None
        user_msg_lower = user_message.lower()
        
        for car in all_careers:
            car_name = car.get("career_name", "")
            if car_name and car_name.lower() in user_msg_lower:
                # Prioritize longer matches to handle sub-strings (e.g. "Software Developer" vs "Developer")
                if not mentioned_career or len(car_name) > len(mentioned_career.get("career_name", "")):
                    mentioned_career = car

        # If a specific career is mentioned, serve its direct facts
        if mentioned_career:
            return self._format_career_details_fallback(mentioned_career, user_message)

        # Extract student matched careers from prompt context if available
        matched_careers = []
        if has_careers:
            try:
                lines = prompt.split("\n")
                for line in lines:
                    if "|" in line and ("match" in line.lower() or "%" in line):
                        parts = line.split("|")
                        c_name = parts[0].split(".", 1)[-1].strip()
                        matched_careers.append(c_name)
            except Exception:
                pass

        if not matched_careers and all_careers:
            matched_careers = [c.get("career_name") for c in all_careers[:5]]

        # Greeting response
        if intent_str == "greeting":
            return f"""👋 Hi {name}! I'm VERA, your AI Career Companion.

I’m here to help you explore career options, understand your strengths, discover required skills, and plan your next steps.

Here's how I can help you:
- 🎯 Discover careers that match your personality (Try asking: *"What careers match me?"*)
- 📋 Get detailed information about any career (Try asking: *"Tell me about {matched_careers[0] if matched_careers else 'Software Developer'}*" or any other field)
- 💰 Learn about salaries and growth opportunities
- 🎓 Find out about educational pathways and targeting colleges
- 💡 Get personalized advice based on your profile

What would you like to explore today? Just ask me anything! 😊"""
        
        # Career-related response
        if intent_str in ["career_recommendation", "career_comparison", "job_information", "salary_query"] or "match" in user_msg_lower:
            if matched_careers:
                response = f"""🎯 **Here are your top career recommendations, {name}:**\n\n"""
                for c_name in matched_careers[:5]:
                    c_data = next((c for c in all_careers if c.get("career_name", "").lower() == c_name.lower()), None)
                    if c_data:
                        desc = c_data.get("description", "Explore details, path, and institutes.")
                        response += f"- **{c_name}**: {desc[:120]}...\n"
                response += f"\n💡 Ask me: *\"Tell me about {matched_careers[0] if matched_careers else 'any of these'}*\" to see their details, required entrance exams, and pathways!"
                return response
            else:
                return f"""💭 Thanks for your question, {name}!

I notice you haven't taken the RIASEC assessment yet. To give you personalized career recommendations, I need to understand your personality type and interests.

Please take the Career Test by clicking the "Start Career Test" button on the page. It only takes a few minutes and will help me find the best career matches for you! 🎯"""
        
        # Profile question
        if intent_str == "profile_question":
            return f"""💭 Great question about your profile, {name}!

Based on the information you've provided, I can help you understand:
- 📊 Your RIASEC personality type
- 💪 Your key strengths and traits
- 🎯 Careers that align with your profile
- 🛠️ Subjects and skills that match you

Your profile gives us valuable insights into what makes you unique. Would you like to explore specific aspects of your profile or see career recommendations? 😊"""
        
        # Off-topic
        if intent_str == "off_topic":
            return f"""💭 I specialize in career guidance and helping students like you find the right path forward!

While I'd love to chat about many topics, I'm best at helping with:
- Career exploration and recommendations
- Educational pathways
- Skill development
- Salary and job market insights
- College and entrance exam guidance

What would you like to know about your career journey? I'm here to help! 😊"""

        # College guidance
        if intent_str == "college_guidance" or "college" in user_msg_lower or "university" in user_msg_lower or "institute" in user_msg_lower:
            response = f"""🎓 **Target Colleges & Institutes for your matched careers:**\n\n"""
            found_any = False
            for c_name in matched_careers[:3]:
                c_data = next((c for c in all_careers if c.get("career_name", "").lower() == c_name.lower()), None)
                if c_data:
                    inst_data = c_data.get("institutes") or c_data.get("where_will_you_study") or c_data.get("study_options", {}).get("government_institutes", [])
                    flat_inst = []
                    if isinstance(inst_data, dict):
                        for key in ["government_institutes", "private_institutes", "distance_learning_institutes", "government", "private", "distance_learning"]:
                            val = inst_data.get(key)
                            if isinstance(val, list):
                                flat_inst.extend(val)
                        if not flat_inst:
                            for val in inst_data.values():
                                if isinstance(val, list):
                                    flat_inst.extend(val)
                    elif isinstance(inst_data, list):
                        flat_inst = inst_data
                    elif isinstance(inst_data, str):
                        flat_inst = [inst_data]

                    if flat_inst:
                        response += f"🏫 **{c_name}**:\n"
                        for i in flat_inst[:3]:
                            name_inst = i.get("name") if isinstance(i, dict) else i
                            loc_inst = i.get("location", "") if isinstance(i, dict) else ""
                            loc_str = f" ({loc_inst})" if loc_inst else ""
                            response += f"  - {name_inst}{loc_str}\n"
                        response += "\n"
                        found_any = True
            if found_any:
                return response
            else:
                return f"""💭 I don't have specific college list details for those matches, but standard options include premier government and private engineering/scientific universities."""

        # Skill guidance
        if intent_str == "skill_guidance" or "skill" in user_msg_lower or "learn" in user_msg_lower:
            response = f"""💡 **Required Skills & Traits for your matched careers:**\n\n"""
            found_any = False
            for c_name in matched_careers[:3]:
                c_data = next((c for c in all_careers if c.get("career_name", "").lower() == c_name.lower()), None)
                if c_data:
                    traits = c_data.get("personality_traits", [])
                    if traits:
                        response += f"🛠️ **{c_name}**:\n"
                        response += f"  - **Traits/Skills**: {', '.join(traits[:5])}\n\n"
                        found_any = True
            if found_any:
                return response
            else:
                return f"""💭 I don't have skill lists for those matches, but typical requirements focus on analytical, programming, and subject-specific problem solving."""
        
        # General fallback
        return f"""💭 Hi {name}! I'm VERA, your Career Companion.

I couldn't contact the Claude API (running in fallback mode), but I can still answer specific questions about careers using our SQLite database!

Try asking me:
- **"Tell me about [career name]"** (e.g., *"Tell me about {matched_careers[0] if matched_careers else 'Software Developer'}*" or any of your matched careers)
- **"What skills do I need for [career]?"**
- **"What are my career matches?"**
- **"Which colleges should I target?"**"""

    def _format_career_details_fallback(self, career: Dict[str, Any], query: str) -> str:
        """Format specific SQLite career details into a readable fallback answer."""
        name = career.get("career_name", "")
        desc = career.get("description", "No description available.")
        
        # Educational Pathway
        pathways = career.get("educational_pathway", []) or career.get("educational_pathways", [])
        path_str = ""
        if pathways:
            if isinstance(pathways, list):
                for p in pathways:
                    if isinstance(p, dict):
                        # Extract the step/detail text
                        detail = p.get("details", "") or p.get("step", "")
                        if not detail and "steps" in p:
                            steps = p.get("steps", [])
                            detail = " ➔ ".join(steps) if isinstance(steps, list) else str(steps)
                        
                        # Extract option/path index
                        opt_idx = p.get("option") or p.get("path") or p.get("step_no", "")
                        opt_prefix = f"Pathway {opt_idx}" if opt_idx else "Step"
                        
                        if detail:
                            path_str += f"- **{opt_prefix}**: {detail}\n"
                        elif p.get("note"):
                            path_str += f"- *Note*: {p.get('note')}\n"
                    else:
                        path_str += f"- {p}\n"
            else:
                path_str = f"- {pathways}\n"
        else:
            path_str = "- Completed 10+2 standard followed by a professional degree or diploma in this field."

        # Income
        income = career.get("expected_income", {})
        salary_str = "Not specified"
        if income:
            if isinstance(income, dict):
                min_sal = income.get("minimum_monthly_salary") or income.get("monthly_salary_inr", {}).get("minimum")
                max_sal = income.get("maximum_monthly_salary") or income.get("monthly_salary_inr", {}).get("maximum")
                note_sal = income.get("note", "")
                if min_sal and max_sal:
                    salary_str = f"{min_sal} - {max_sal} per month"
                elif note_sal:
                    salary_str = note_sal
                else:
                    salary_str = "INR 30,000 - 80,000 per month (approx)"
            else:
                salary_str = str(income)

        # Entrance Exams
        exams = career.get("entrance_exams", [])
        exams_str = ", ".join(exams) if exams else "None specified (or standard merit-based admission)"

        # Colleges
        colleges = career.get("institutes", []) or career.get("study_options", {}).get("government_institutes", [])
        colleges_list = []
        if colleges:
            for c in colleges[:4]:
                c_name = c.get("name") if isinstance(c, dict) else c
                c_loc = c.get("location", "") if isinstance(c, dict) else ""
                colleges_list.append(f"{c_name} ({c_loc})" if c_loc else c_name)
        colleges_str = "\n".join(f"- {c}" for c in colleges_list) if colleges_list else "- Premier Universities & Regional Institutes"

        # Growth Path
        growth = career.get("growth_path", [])
        growth_str = " ➔ ".join(growth[:4]) if growth else "Entry Level ➔ Senior Specialist ➔ Lead Manager"

        query_lower = query.lower()
        
        if "exam" in query_lower:
            return f"""🎓 **Entrance Exams for {name}:**
            
Standard admission/entrance criteria:
- **Exams**: {exams_str}

Would you like to know about the study options or required course fees? 😊"""

        if "college" in query_lower or "university" in query_lower or "study" in query_lower:
            return f"""🏫 **Recommended Study Options for {name}:**
            
Here are the top colleges and institutes offering training or degree programs:
{colleges_str}

Would you like to know about the entrance exams or course fees? 😊"""

        if "salary" in query_lower or "pay" in query_lower or "income" in query_lower:
            return f"""💰 **Salary & Compensation for {name}:**
            
- **Expected Income**: {salary_str}
- **Growth Path**: {growth_str}"""

        if "skill" in query_lower or "trait" in query_lower:
            traits = career.get("personality_traits", [])
            traits_str = "\n".join(f"- {t}" for t in traits) if traits else "- Analytical thinking\n- Subject matter expertise"
            return f"""🛠️ **Key Skills & Personality Traits for {name}:**
            
To succeed in this career, having these traits is highly recommended:
{traits_str}"""

        # General description response
        return f"""🎯 **Career Profile: {name}**

{desc}

📚 **Educational Pathway**:
{path_str}
💰 **Expected Salary**:
- {salary_str}

🏫 **Top Colleges**:
{colleges_str}

📈 **Career Growth**:
- {growth_str}

📝 **Entrance Exams**:
- {exams_str}"""


# Singleton instance
nova = NovaEngine()