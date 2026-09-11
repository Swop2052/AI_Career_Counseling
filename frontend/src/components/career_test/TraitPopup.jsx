import React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import ConfettiBlast from "./ConfettiBlast.jsx";
import Visual from "./Visual.jsx";

const CATEGORY_FEEDBACK = {
  Realistic: {
    title: "Your Career Journey Has Just Begun! ",
    subtitle: "Keep going and discover where your interests can take you.",
  },
  Investigative: {
    title: "You’ve Started Discovering Yourself! ",
    subtitle: "Every answer brings you closer to understanding your unique strengths.",
  },
  Artistic: {
    title: "Discover More. Dream Bigger. Go Further. ",
    subtitle: "Your journey to discovering the right career starts with knowing yourself.",
  },
  Social: {
    title: "Your Choices Have a Story to Tell! ",
    subtitle: "Keep answering honestly and discover what makes you different.",
  },
  Enterprising: {
    title: "One Step Closer to Your Future! ",
    subtitle: "Keep going. Your interests may reveal possibilities you’ve never imagined.",
  },
  Conventional: {
    title: "You’re Doing Great! Keep Going! ",
    subtitle: "The next question could reveal something new about you.",
  },
};

export default function TraitPopup({ popup, popupInfo, onContinue }) {
  if (!popup || !popupInfo) return null;

  const brandDark = "#062E27";
  const brandGold = "#D4AF37";
  const feedbackData = CATEGORY_FEEDBACK[popup.key] || {
    title: "You’ve Started Discovering Yourself!",
    subtitle: "Every answer brings you closer to understanding your unique strengths.",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 py-6 ${
        popup.phase === "exit" ? "qm-overlay-exit" : "qm-overlay-enter"
      }`}
    >
      <div
        className={`relative w-full max-w-lg sm:max-w-xl bg-white rounded-[2.5rem] border border-slate-200/90 shadow-[0_24px_70px_-15px_rgba(6,46,39,0.3)] p-6 sm:p-9 text-center select-none overflow-hidden ${
          popup.phase === "exit" ? "qm-popup-exit" : "qm-popup-enter"
        }`}
      >
        {popup.phase !== "exit" && <ConfettiBlast count={85} />}

        <button
          onClick={() => onContinue(true)}
          aria-label="Close"
          className="absolute top-5 right-5 w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all bg-white z-20 cursor-pointer"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Visual Mascot Box */}
        <div className="relative flex justify-center items-center my-4 h-28 sm:h-32">
          <span className="qm-ring absolute w-24 h-24 rounded-full bg-emerald-900/20" />
          <div
            className="qm-icon-pop relative w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl border border-slate-100 shadow-[0_8px_20px_rgba(6,46,39,0.12)] z-10"
            style={{ background: "#CFEDED" }}
          >
            <Visual value={popupInfo.emoji} className="w-11 h-11 sm:w-12 sm:h-12 object-contain" />
          </div>
          <span className="qm-sparkle absolute text-xl text-amber-500 top-0 left-[calc(50%-60px)]">✦</span>
          <span className="qm-sparkle absolute text-sm text-emerald-700 top-3 right-[calc(50%-60px)]" style={{ animationDelay: ".4s" }}>✦</span>
        </div>

        {/* Congratulations Banner */}
        <div className="qm-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest text-[#062E27] border border-[#062E27]/20 shadow-sm mb-3.5" style={{ background: "#CFEDED" }}>
          <Sparkles size={14} className="animate-spin text-amber-600" />
          <span>Congratulations!</span>
          <Sparkles size={14} className="animate-spin text-amber-600" />
        </div>

        {/* Title */}
        <h2
          className="qm-fade-up text-xl sm:text-2xl md:text-3xl font-bold text-[#062E27] tracking-wide leading-tight mb-3 px-2"
          style={{ fontFamily: "'Fredoka', sans-serif", animationDelay: "0.08s" }}
        >
          {feedbackData.title}
        </h2>

        {/* Subtitle Card */}
        <div
          className="qm-fade-up rounded-2xl p-4 mb-7 border border-slate-200/80 shadow-sm"
          style={{ background: "#CFEDED", animationDelay: "0.15s" }}
        >
          <p className="text-[#062E27] font-semibold text-sm sm:text-base leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
            “{feedbackData.subtitle}”
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => onContinue(true)}
          className="qm-fade-up w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-white font-bold text-base uppercase tracking-wider cursor-pointer shadow-[0_12px_24px_-6px_rgba(6,46,39,0.4)] active:scale-[0.99] transition-all duration-150"
          style={{
            background: "linear-gradient(180deg, #0B3B32 0%, #062E27 100%)",
            fontFamily: "'Fredoka', sans-serif",
            animationDelay: "0.22s",
          }}
        >
          <span>Continue</span>
          <ArrowRight size={20} strokeWidth={2.8} style={{ color: brandGold }} />
        </button>
      </div>
    </div>
  );
}