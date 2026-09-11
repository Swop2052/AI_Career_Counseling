import { RotateCcw } from "lucide-react";
import ConfettiBlast from "./ConfettiBlast.jsx";

export default function ResultsCard({ total, onRestart }) {
  return (
    <div className="relative w-full bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_10px_40px_-14px_rgba(0,0,0,0.18)] flex flex-col items-center text-center py-10 sm:py-12 px-5 sm:px-6 overflow-hidden">
      <ConfettiBlast />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-4 h-24 w-24">
          <span className="qm-glow-pulse absolute inset-0 rounded-full" style={{ background: "#FDE68A" }} />
          <div className="qm-trophy-bounce relative text-6xl sm:text-7xl"></div>
        </div>

        <h1 className="qm-title-slide text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          Nice work! 
        </h1>
        <p className="qm-title-slide text-slate-500 font-bold mb-7 sm:mb-8" style={{ animationDelay: ".05s" }}>
          You answered all {total} questions.
        </p>
        <button
          onClick={onRestart}
          className="qm-title-slide flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-2xl text-white font-extrabold shadow-[0_4px_0_0_#4338CA] active:shadow-[0_1px_0_0_#4338CA] active:translate-y-[3px] transition-all hover:-translate-y-0.5"
          style={{ background: "#6366F1", fontFamily: "'Baloo 2', sans-serif", animationDelay: ".1s" }}
        >
          <RotateCcw size={18} strokeWidth={3} /> Start over
        </button>
      </div>
    </div>
  );
}
