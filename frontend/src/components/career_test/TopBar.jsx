import React from "react";
import { Volume2, VolumeX, Sun } from "lucide-react";

export default function TopBar({ progress = 0, muted = false, onToggleMute }) {
  return (
    <header className="w-full max-w-4xl px-2 sm:px-4 flex items-center gap-3 sm:gap-4 select-none">
    
     

      {/* Deep Emerald Progress Bar */}
      <div className="flex-1 relative h-4 sm:h-5 rounded-full bg-slate-100 border border-slate-200/80 p-0.5 shadow-inner overflow-hidden flex items-center">
        <div
          key={progress}
          className="qm-progress-fill relative h-full rounded-full transition-all duration-500 ease-out overflow-hidden"
          style={{
            width: `${Math.max(progress, 5)}%`,
            background: "linear-gradient(90deg, #021c1b 0%, #04302e 50%, #06423f 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent qm-progress-shine" />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#34D399]" />
        </div>
      </div>

      {/* Progress XP Pill */}
      <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 sm:px-3 py-1 rounded-full border border-slate-200 shadow-sm">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#021c1b] flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-amber-400">
        
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-800" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          {progress}%
        </span>
      </div>

      {/* Sound Toggle Button */}
      <button
        onClick={onToggleMute}
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
          muted
            ? "bg-slate-50 border-slate-200 text-slate-400"
            : "bg-white border-slate-200 text-[#021c1b] shadow-sm hover:bg-slate-50"
        }`}
      >
        {muted ? <VolumeX size={17} strokeWidth={2.4} /> : <Volume2 size={17} strokeWidth={2.4} />}
      </button>
    </header>
  );
}