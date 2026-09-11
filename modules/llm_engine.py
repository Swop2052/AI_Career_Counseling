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
                error_msg = str(e)
                print(f"[ERROR] Anthropic LLM Engine Error: {error_msg}")
                return f"🚨 Anthropic API Error: {error_msg}\n\nPlease check your API key, billing status, or network connection."
        
        # If Anthropic client is unconfigured
        return "🚨 Anthropic API Client is not configured. Please add a valid ANTHROPIC_API_KEY to your .env file."
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for VERA."""
        return """You are VERA, a professional, warm, and encouraging AI Career Companion (similar to ChatGPT). 

Your goal is to have natural, open conversations with students, understand their context, and guide them towards their best career pathways.

GUIDELINES:
- **Strict Domain Boundary**: You MUST ONLY answer questions related to careers, education, colleges, subjects, and skill development. If a user asks about anything outside of education and careers (e.g., politics, coding scripts, trivia, cooking, general knowledge), politely decline and remind them you are solely an AI Career Counselor.
- **Reference Career Data (Data.json)**: When the student asks for specific factual details about a career (such as course fees, required entrance exams, target colleges, growth paths, or salaries), you MUST refer to the provided career database (Data.json information injected in the prompt) as your primary reference to guide them accurately.
- **Anti-Hallucination & Accuracy**: Do NOT invent or make up specific numbers (like salaries or fees) or exams if they are not in the database. If specific factual metrics for a career are missing from the provided data, say honestly: "I don't have those specific figures in my career database, but generally..." and use your broad general knowledge to guide them without misleading.
- **Conversational Tone**: Use emojis, address the student by name when available, be encouraging, and keep the interaction engaging and supportive. Help them explore their matches!"""
    



# Singleton instance
nova = NovaEngine()