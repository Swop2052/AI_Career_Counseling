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
    print("✅ Successfully applied httpx client proxies monkeypatch")
except Exception as e:
    print(f"⚠️ httpx monkeypatch not applied or not needed: {e}")


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
            print("⚠️ WARNING: ANTHROPIC_API_KEY not found in .env file!")
            return
        
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self.api_key)
            print("✅ VERA LLM Engine initialized with Anthropic")
        except ImportError:
            print("⚠️ WARNING: anthropic package not installed!")
        except Exception as e:
            print(f"⚠️ WARNING: Failed to initialize Anthropic client: {e}")

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a response using the LLM (Anthropic) with static fallback.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system instructions
            temperature: Optional temperature override
            max_tokens: Optional max tokens override
            
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
                print("✨ Response generated successfully via Anthropic Client!")
                return response.content[0].text
                
            except Exception as e:
                print(f"❌ Anthropic LLM Engine Error: {e}")
        
        # Fallback if Anthropic fails or is unconfigured
        return self._get_fallback_response(prompt)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for VERA."""
        return """You are VERA, a professional AI Career Companion with expertise in psychometric assessment and career guidance.

Your responsibility is to:
- Have warm, natural conversations with students
- Answer questions about careers using ONLY the provided career data
- Explain why each career suits the student's profile
- Be encouraging, friendly, and conversational
- Remember the earlier conversation context

STRICT RULES:
- NEVER create new careers that are not in the provided data
- NEVER generate information not present in the retrieved context
- Use ONLY retrieved career information from the career database
- If information is unavailable, clearly say: "I don't have that information in my career database"
- All recommendations must be grounded in the provided career data
- Do NOT hallucinate or invent any career information

STYLE:
- Be warm, friendly, and encouraging
- Use the student's name when possible
- Use emojis occasionally for a friendly tone (😊, 🚀, 🎯)
- Provide specific, actionable advice
- Keep responses conversational and helpful

Remember: You are a helpful career companion. If you don't know something, say so honestly."""
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Generate a fallback response when the LLM is unavailable."""
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
        
        # Extract intent
        intent = "general_chat"
        if "Intent:" in prompt:
            lines = prompt.split("\n")
            for line in lines:
                if line.strip().startswith("Intent:"):
                    intent = line.split("Intent:")[1].strip()
                    break
        
        # Check if there are career matches
        has_careers = "AVAILABLE CAREERS" in prompt and "|" in prompt
        
        # Greeting response
        if intent == "greeting":
            return f"""👋 Hi! I'm VERA, your AI Career Companion. 🚀

I’m here to help you explore career options, understand your strengths, discover required skills, and plan your next steps.

Here's how I can help you:
- 🎯 Discover careers that match your personality
- 📚 Get detailed information about any career
- 💰 Learn about salaries and growth opportunities
- 🎓 Find out about educational pathways
- 💡 Get personalized advice based on your profile

What would you like to know about today? Just ask me anything! 😊"""
        
        # Career-related response
        if intent in ["career_recommendation", "career_comparison", "job_information", "salary_query"]:
            if has_careers:
                return f"""💭 Thanks for your question, {name}!

Based on your profile and the available career data, here's what I can tell you:

I've found several career matches for you. To get the most helpful information, please ask about a specific career you're interested in, and I'll provide details about:
- 📋 What the career involves
- 🎓 Educational pathway required
- 💰 Expected salary range
- 📝 Entrance exams (if any)
- 📈 Growth opportunities

Which career would you like to learn more about? 🚀"""
            else:
                return f"""💭 Thanks for your question, {name}!

I notice you haven't taken the RIASEC assessment yet. To give you personalized career recommendations, I need to understand your personality type and interests.

Please take the Career Test by clicking the "Start Career Test" button on the page. It only takes a few minutes and will help me find the best career matches for you! 🎯"""
        
        # Profile question
        if intent == "profile_question":
            return f"""💭 Great question about your profile, {name}!

Based on the information you've provided, I can help you understand:
- 🧠 Your RIASEC personality type
- 💪 Your key strengths and traits
- 🎯 Careers that align with your profile
- 📚 Subjects and skills that match you

Your profile gives us valuable insights into what makes you unique. Would you like to explore specific aspects of your profile or see career recommendations? 😊"""
        
        # Off-topic
        if intent == "off_topic":
            return f"""💭 I specialize in career guidance and helping students like you find the right path forward! 🚀

While I'd love to chat about many topics, I'm best at helping with:
- Career exploration and recommendations
- Educational pathways
- Skill development
- Salary and job market insights
- College and entrance exam guidance

What would you like to know about your career journey? I'm here to help! 😊"""
        
        # General fallback
        return f"""💭 Hi {name}! I'm here to help you with your career journey.

### What you can ask me:
- **"Tell me about [career name]"** - Get detailed info about a specific career
- **"What careers match me?"** - I'll explain your top matches
- **"What skills do I need for [career]?"** - Learn about required skills
- **"How much does [career] pay?"** - Check salary information
- **"What exams do I need for [career]?"** - Learn about entrance exams

Just type your question and I'll help you out! 🚀"""


# Singleton instance
nova = NovaEngine()