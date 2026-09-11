import React from "react";
import { ArrowRight } from "lucide-react";
import { CATEGORY_ORDER } from "../data/categoryInfo.js";
import Visual from "./Visual.jsx";

export default function IntroCard({ category, info, questionCount, onStart }) {
  const traitNumber = CATEGORY_ORDER.indexOf(category) + 1;
  const brandColor = info?.color || "#58CC02";

  return (
    <div className="w-full bg-white rounded-[2rem] border-2 border-slate-100 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)] flex flex-col items-center text-center py-7 sm:py-9 px-5 sm:px-8 qm-popup-enter select-none">
      
      {/* Subheading / Trait Badge */}
      <div className="flex justify-center mb-4 sm:mb-5">
        <span
          className="text-[10px] sm:text-[11px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase"
          style={{
            color: brandColor,
            background: "#CFEDED",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Trait {traitNumber} of {CATEGORY_ORDER.length}
        </span>
      </div>

      {/* Floating Animated Mascot / Icon */}
      <div className="relative flex items-center justify-center mb-5 sm:mb-6 h-24 sm:h-28">
        {/* Pulsing Duolingo-style rings */}
        <span
          className="qm-intro-ring absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full"
          style={{ background: brandColor }}
        />
        <span
          className="qm-intro-ring absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full"
          style={{ background: brandColor, animationDelay: "0.6s" }}
        />

        {/* Floating Box Container */}
        <div
          className="qm-intro-float relative w-20 h-20 sm:w-24 sm:h-24 rounded-[1.75rem] flex items-center justify-center text-4xl sm:text-5xl border-2 border-slate-100 shadow-[0_6px_0_0_#E2E8F0]"
          style={{ background: "#CFEDED" }}
        >
          <Visual value={info.emoji} className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
        </div>
      </div>

      {/* Category Heading (Fredoka) */}
      <h1
        className="text-2xl sm:text-3xl font-bold mb-2 tracking-wide text-slate-800"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        {category}
      </h1>

      {/* Category Description (Poppins) */}
      <p
        className="text-slate-500 font-medium text-sm sm:text-[15px] leading-relaxed mb-5 sm:mb-6 max-w-sm"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {info.desc}
      </p>

      {/* Strengths Pills (Duolingo 3D mini-pills) */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-7">
        {info.strengths?.map((s, idx) => (
          <span
            key={s.label || idx}
            className="qm-fade-up flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs border border-slate-200/80 shadow-[0_2px_0_0_#E2E8F0] transition-transform hover:-translate-y-0.5"
            style={{
              background: "#FFFFFF",
              color: brandColor,
              fontFamily: "'Poppins', sans-serif",
              animationDelay: `${idx * 60}ms`,
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </span>
        ))}
      </div>

      {/* Helper Note */}
      <p
        className="text-[11px] sm:text-xs font-medium text-slate-400 mb-6"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        You'll answer {questionCount} quick questions like this one, then move to the next trait.
      </p>

      {/* Duolingo-style 3D CTA Button */}
      <button
        onClick={onStart}
        className="w-full max-w-xs flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-white font-bold text-base uppercase tracking-wider cursor-pointer border-b-4 border-black/20 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:border-b-0 active:translate-y-1 active:shadow-none transition-all duration-100"
        style={{
          background: brandColor,
          fontFamily: "'Fredoka', sans-serif",
        }}
      >
        <span>Let's Go</span>
        <ArrowRight size={20} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}         