import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Send, User, RefreshCw,
  BookOpen, Cpu, Palette, Zap
} from 'lucide-react';
import SparkMascot from '../../assets/spark-mascot.png';
import { useLanguage } from '../../translations/LanguageContext';

const getQuickTopics = (t) => [
  {
    label: t('streamDecision'),
    icon: BookOpen,
    query: t('streamQuery')
  },
  {
    label: t('futureTech'),
    icon: Cpu,
    query: t('techQuery')
  },
  {
    label: t('creativeDesign'),
    icon: Palette,
    query: t('creativeQuery')
  },
  {
    label: t('collegeRoadmap'),
    icon: Zap,
    query: t('collegeQuery')
  },
];

export default function AICounselorPage({ onBack, currentUser }) {
  const { t, language } = useLanguage();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: t('veraWelcome'),
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Prevent scroll jump on page load; keep view fixed at the top
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Only scroll down inside chat container when user sends new messages
  useEffect(() => {
    if (messages.length > 1 || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    try {
      if (!currentUser?.email) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "First login ok",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      const payload = { message: text, language: language, email: currentUser.email };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 401) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "First login ok",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      const data = await response.json();
      
      let replyText = data.response || "I apologize, but I couldn't process your request right now. Could you please rephrase?";
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Sorry, I'm having trouble connecting to the server. Please check your network and try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  return (
    <div className="w-full mt-5 min-h-[calc(100vh-80px)] bg-[#CFEDED] text-[#04211F] flex flex-col justify-between font-sans selection:bg-[#09A3A3] selection:text-white relative">
      
      {/* 1. Chat Bubble Stream (Scrollable inside container) */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-6">
        <div className="space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-white border border-[#09A3A3]/20 overflow-hidden shrink-0 shadow-sm mt-0.5 p-1 flex items-center justify-center">
                    <img
                      src={SparkMascot}
                      alt="VERA AI"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                )}

                <div
                  className={`relative text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'max-w-[82%] sm:max-w-[75%] px-5 py-3.5 rounded-[26px] rounded-br-sm bg-[#04302E] text-white shadow-md'
                      : 'w-full max-w-[92%] sm:max-w-[85%] px-6 py-5 rounded-[28px] rounded-tl-sm bg-white/95 backdrop-blur-md border border-white text-[#04211F] shadow-[0_10px_25px_rgba(4,48,46,0.04)]'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed font-medium">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-2 font-semibold ${
                      isUser ? 'text-white/60 text-right' : 'text-[#0B3D3D]/40 text-left'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#04302E]/10 border border-[#04302E]/15 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4 text-[#04302E]" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-9 h-9 rounded-2xl bg-white border border-[#09A3A3]/20 overflow-hidden shrink-0 shadow-sm p-1 flex items-center justify-center">
                <img
                  src={SparkMascot}
                  alt="VERA AI"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="bg-white/95 backdrop-blur-md border border-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#09A3A3] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#09A3A3] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#09A3A3] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* 2. Fixed Bottom Composer Area */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8 pt-2">
        <div className="flex flex-col gap-3">
          
          {/* Quick Topics Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
            {getQuickTopics(t).map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => handleSend(topic.query)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#09A3A3]/25 text-xs font-bold text-[#04211F] hover:text-[#09A3A3] transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-[#09A3A3]" />
                  <span>{topic.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleClear}
              title="Reset Chat"
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 border border-[#09A3A3]/20 shadow-sm ml-auto shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center bg-white rounded-3xl p-1.5 shadow-[0_12px_30px_rgba(4,48,46,0.08)] border border-white"
          >
            <div className="flex-1 bg-white border border-[#09A3A3]/20 rounded-2xl shadow-sm focus-within:border-[#09A3A3] focus-within:ring-2 focus-within:ring-[#09A3A3]/10 transition-all flex items-end">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('placeholderText')}
                className="w-full max-h-[120px] bg-transparent text-sm text-[#04211F] placeholder:text-[#0B3D3D]/40 outline-none resize-none py-3.5 px-4 scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-2xl bg-[#09A3A3] text-white flex items-center justify-center hover:bg-[#04302E] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer mr-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}