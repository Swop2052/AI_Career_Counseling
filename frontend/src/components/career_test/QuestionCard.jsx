import React from "react";
import { Check } from "lucide-react";
import Visual from "./Visual.jsx";

export default function QuestionCard({
  question,
  info,
  renderIndex,
  translate = 0,
  noTransition = false,
  selected,
  burstValue,
  burstKey,
  busy,
  onSelect,
}) {
  const brandDark = "#062E27";

  return (
    <div
      className="w-full h-full"
      style={{
        transform: `translateX(${translate}%)`,
        transition: noTransition ? "none" : "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div className="w-full h-full bg-white rounded-[2rem] border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(6,46,39,0.08)] p-4 sm:p-6 flex flex-col justify-between select-none">
        
        {/* Header Section */}
        <div>
          <div className="flex justify-center mb-2">
            <span
              className="text-[10px] sm:text-[11px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase"
              style={{
                color: brandDark,
                background: "#CFEDED",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {question.category}
            </span>
          </div>

          <div className="flex justify-center mb-3">
            <div
              key={renderIndex}
              className="qm-visual w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-[1.5rem] sm:rounded-[1.75rem] flex items-center justify-center text-3xl sm:text-4xl border border-slate-100 shadow-[0_4px_12px_rgba(6,46,39,0.06)]"
              style={{ background: "#CFEDED" }}
            >
              <Visual value={question.visual} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
          </div>

          <h2
            className="text-center text-sm sm:text-base md:text-lg font-bold text-slate-900 mb-3 sm:mb-4 px-2 leading-snug tracking-wide min-h-[40px] flex items-center justify-center"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            {question.text}
          </h2>
        </div>

        {/* 5 Options List */}
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selected === opt.value;
            const isBursting = burstValue === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => onSelect(opt)}
                disabled={busy}
                style={{
                  borderColor: isSelected ? brandDark : "#E2E8F0",
                  background: isSelected ? brandDark : "#FFFFFF",
                  boxShadow: isSelected
                    ? "0 4px 16px -2px rgba(6,46,39,0.35)"
                    : "0 2px 5px rgba(0,0,0,0.03)",
                  animationDelay: `${i * 35}ms`,
                }}
                className={`qm-option-in relative flex items-center gap-3 sm:gap-3.5 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 text-left cursor-pointer transition-all duration-150 active:scale-[0.98] ${
                  isSelected ? "text-white" : "text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {isBursting && (
                  <span className="pointer-events-none absolute left-8 top-1/2 z-20" key={burstKey}>
                    {[...Array(6)].map((_, idx) => {
                      const angle = (idx * 360) / 6;
                      const rad = (angle * Math.PI) / 180;
                      const tx = Math.cos(rad) * 32;
                      const ty = Math.sin(rad) * 32;
                      return (
                        <span
                          key={idx}
                          className="qm-particle absolute text-xs select-none"
                          style={{ "--tx": `${tx}px`, "--ty": `${ty}px`, color: "#D4AF37" }}
                        >
                          ✦
                        </span>
                      );
                    })}
                  </span>
                )}

                <span className={`text-lg sm:text-xl md:text-2xl shrink-0 ${isSelected ? "qm-emoji-pop scale-110" : ""}`}>
                  <Visual value={opt.emoji} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                </span>

                <span
                  className={`font-semibold text-xs sm:text-[13px] md:text-[13.5px] flex-1 tracking-normal leading-tight ${
                    isSelected ? "text-white" : "text-slate-800"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {opt.label}
                </span>

                <span
                  className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg border flex items-center justify-center transition-all duration-150"
                  style={{
                    borderColor: isSelected ? "#D4AF37" : "#CBD5E1",
                    background: isSelected ? "#D4AF37" : "transparent",
                  }}
                >
                  {isSelected && <Check size={13} strokeWidth={3.5} className="text-[#062E27] qm-check-pop" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}