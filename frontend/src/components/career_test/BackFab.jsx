import React from "react";
import { ArrowLeft } from "lucide-react";

export default function BackFab({ canGoBack, onBack }) {
  if (!canGoBack) return null;

  return (
    <div className="flex justify-start w-full mt-3 z-40 select-none">
      <button
        onClick={onBack}
        aria-label="Previous Question"
        className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#021c1b] text-white border border-emerald-800/80 shadow-[0_6px_20px_rgba(6,46,39,0.35)] hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        <ArrowLeft size={16} strokeWidth={3} className="text-[#D4AF37]" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">Back</span>
      </button>
    </div>
  );
}