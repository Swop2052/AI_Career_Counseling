import React, { useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import SparkMascot from './assets/spark-mascot.png';

const QUICK_REPLIES = ['Explore careers', 'Pick my subjects', 'What is this test?'];

export default function AICounselor() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <div
        className={`transition-all duration-300 ease-out origin-bottom-right ${
          chatOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-3 pointer-events-none'
        } w-[88vw] max-w-[340px] bg-white/90 backdrop-blur-xl rounded-[1.75rem] shadow-2xl shadow-[#04211F]/20 border border-white/60 overflow-hidden`}
      >
        <div className="relative bg-gradient-to-br from-[#09A3A3] to-[#04302E] px-5 py-4 flex items-center gap-3 text-white overflow-hidden">
          <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#E8B04B]/20 blur-2xl" />
          
          {/* Header Profile Mascot Image */}
          <div className="relative w-10 h-10 rounded-full bg-white/15 ring-2 ring-white/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <img
              src={SparkMascot}
              alt="Spark Mascot Profile"
              className="w-full h-full object-cover object-center scale-110"
            />
            {/* Active Status Badge */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#04302E]" />
          </div>

          <div className="relative">
            <div className="font-display font-semibold text-sm">AI Career Counselor</div>
            <div className="text-[11px] text-white/75 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Online now
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#CFEDED]/20 min-h-[120px] space-y-3">
          <div className="bg-white rounded-2xl rounded-tl-sm p-3 text-sm text-[#0B3D3D] max-w-[85%] shadow-sm">
            Hi there! 👋 I'm your AI Career Counselor. Ask me anything about subjects, careers, or your quiz results!
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                className="text-xs font-medium text-[#078686] bg-white border border-[#09A3A3]/20 rounded-full px-3 py-1.5 hover:bg-[#09A3A3] hover:text-white hover:border-[#09A3A3] transition-all duration-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-black/5 bg-white">
          <input
            type="text"
            placeholder="Type your question…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3]/40 transition-shadow"
          />
          <button className="rounded-full bg-gradient-to-br from-[#09A3A3] to-[#04302E] text-white p-2.5 shadow-md shadow-[#09A3A3]/30 hover:brightness-110 transition-all duration-200">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating trigger with spinning gradient ring */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="relative flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95"
        style={{ width: '3.9rem', height: '3.9rem' }}
      >
        {!chatOpen && (
          <span
            className="absolute -inset-1 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, #09A3A3, #E8B04B, #09A3A3)',
              animationDuration: '3.5s',
            }}
          />
        )}
        {!chatOpen && <span className="ping-ring absolute inset-0 rounded-full border-2 border-[#09A3A3]/60" />}
        <span className="absolute inset-[3px] rounded-full shadow-xl shadow-[#04211F]/30 flex items-center justify-center text-white overflow-hidden bg-gradient-to-br from-[#09A3A3] to-[#04302E]">
          {chatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <img
              src={SparkMascot}
              alt="Spark, your AI career counselor"
              className="w-full h-full object-cover object-center scale-110"
            />
          )}
        </span>
      </button>
    </div>
  );
}