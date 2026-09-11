import React from "react";
import { Zap } from "lucide-react";
import Visual from "./Visual.jsx";

export default function MicroToast({ feedback }) {
  if (!feedback) return null;

  const brandGold = "#D4AF37";

  return (
    <div className="fixed left-0 right-0 bottom-4 sm:bottom-6 z-[100] px-4 pointer-events-none flex justify-center items-center select-none">
      <div
        className="qm-toast pointer-events-auto w-full max-w-sm sm:max-w-md bg-[#021c1b] text-white border border-emerald-800/40 rounded-[1.75rem] sm:rounded-3xl p-3.5 sm:p-4 shadow-[0_16px_40px_-10px_rgba(6,46,39,0.4)] flex items-center gap-3.5"
      >
        <div
          className="qm-icon-pop relative shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border border-emerald-700/50 shadow-sm"
          style={{ background: "#06423f" }}
        >
          <span className="qm-ring absolute inset-0 rounded-2xl border-2 border-emerald-400/60 pointer-events-none" />
          {feedback.emoji ? (
            <span className="qm-emoji-pop relative z-10 flex items-center justify-center">
              <Visual value={feedback.emoji} className="w-6 h-6 object-contain" />
            </span>
          ) : (
            <Zap size={22} strokeWidth={2.5} style={{ color: brandGold }} className="relative z-10" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
          <span
            className="qm-fade-up text-sm font-extrabold tracking-wide leading-tight truncate text-amber-300"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            {feedback.title || "Insight Unlocked! "}
          </span>

          <span
            className="qm-fade-up text-xs font-medium text-emerald-100/90 leading-snug mt-0.5"
            style={{ fontFamily: "'Poppins', sans-serif", animationDelay: "0.05s" }}
          >
            {feedback.text}
          </span>
        </div>
      </div>
    </div>
  );
}