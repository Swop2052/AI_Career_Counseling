import React from "react";
import { Check } from "lucide-react";
import Visual from "./Visual.jsx";

export default function SideTimelinePanel({
  progress = 0,
  categoryStats = [],
  feedback,
  currentCategoryScore = 0,
  currentCategoryEmoji = "/images/icons/sparkle.png",
  done = false,
  appConfig,
}) {
  const brandDark = "#062E27";
  const brandGold = "#D4AF37";
  const CATEGORY_INFO = appConfig?.CATEGORY_INFO || {};

  const timelineSteps = [
    { key: "start", title: "Start", color: brandDark, emoji: "/images/icons/rocket.png", meta: "Intro", status: "done" },
    ...categoryStats.map((c) => ({
      key: c.cat,
      title: c.cat,
      color: brandDark,
      emoji: CATEGORY_INFO[c.cat]?.emoji || "/images/icons/target.png",
      meta: `${c.answeredInCat}/${c.totalInCat}`,
      status: c.isDone ? "done" : c.isCurrent ? "current" : "pending",
    })),
    { key: "results", title: "Career Profile", color: brandDark, emoji: "/images/icons/trophy.png", meta: "Goal", status: done ? "current" : "pending" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-full shrink-0 select-none">
      <div className="w-full h-full bg-white rounded-[2rem] border border-slate-200/90 shadow-[0_10px_30px_-10px_rgba(6,46,39,0.08)] p-4 sm:p-5 flex flex-col justify-between">
        
        {/* Header & Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 text-sm tracking-wide" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Quest Progress
            </span>
            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm"
              style={{ background: "#CFEDED" }}
            >
              <span className="text-xs font-bold text-[#062E27]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                {progress}%
              </span>
            </div>
          </div>

          <div className="h-2 rounded-full bg-slate-100 border border-slate-200 p-0.5 shadow-inner mb-3 overflow-hidden flex items-center">
            <div
              key={progress}
              className="qm-progress-fill relative h-full rounded-full transition-all duration-500 ease-out overflow-hidden"
              style={{
                width: `${Math.max(progress, 4)}%`,
                background: "linear-gradient(90deg, #062E27 0%, #0B3B32 100%)",
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent qm-progress-shine" />
            </div>
          </div>

          {/* Micro Feedback Banner */}
          <div className="mb-3">
            {feedback ? (
              <div
                key={feedback.key}
                className="qm-side-toast rounded-2xl p-2 sm:p-2.5 flex items-center gap-2.5 border border-emerald-900/20 shadow-sm"
                style={{ background: "#062E27" }}
              >
                <div
                  className="qm-side-badge-pop shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-[11px] shadow-sm"
                  style={{ background: brandGold, color: brandDark, fontFamily: "'Fredoka', sans-serif" }}
                >
                  {currentCategoryScore}%
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-bold text-xs leading-snug tracking-wide truncate text-emerald-100"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {feedback.text}
                  </div>
                  <div className="text-[10px] font-medium text-emerald-300/80 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    "{feedback.label}"
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-2 sm:p-2.5 border border-slate-200/80 shadow-sm flex items-center gap-2"
                style={{ background: "#CFEDED" }}
              >
                <span className="text-base sm:text-lg shrink-0">
                  <Visual value={currentCategoryEmoji} className="w-4 h-4 sm:w-[18px] sm:h-[18px] object-contain" />
                </span>
                <p className="text-[10px] sm:text-[10.5px] font-semibold text-[#062E27] leading-tight truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Select an answer to unlock insights!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stepper Timeline Pathway */}
        <div className="relative pl-0.5">
          <div className="absolute left-3.5 sm:left-4 top-2.5 bottom-2.5 w-1 rounded-full bg-slate-100" />

          <div className="flex flex-col gap-1 sm:gap-1.5">
            {timelineSteps.map((step) => {
              const isDone = step.status === "done";
              const isCurrent = step.status === "current";
              const isPending = step.status === "pending";

              return (
                <div
                  key={step.key}
                  className={`relative flex items-center gap-2.5 sm:gap-3 p-1 sm:p-1.5 rounded-xl transition-all ${
                    isCurrent ? "bg-[#062E27]/5 border border-[#062E27]/15" : ""
                  }`}
                >
                  <div className="relative z-10 shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                    {isDone ? (
                      <span
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-amber-300 shadow-sm"
                        style={{ background: brandDark }}
                      >
                        <Check size={13} strokeWidth={3.5} />
                      </span>
                    ) : isCurrent ? (
                      <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                        <span className="qm-ring absolute w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-900/20" />
                        <span
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-amber-300 text-xs shadow-md animate-bounce"
                          style={{ background: brandDark }}
                        >
                          <Visual value={step.emoji} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
                        </span>
                      </span>
                    ) : (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 flex items-center justify-between">
                    <span
                      className={`font-bold text-xs tracking-wide truncate ${
                        isPending ? "text-slate-400" : isCurrent ? "text-[#062E27] font-extrabold" : "text-slate-700"
                      }`}
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      {step.title}
                    </span>

                    {step.meta && (
                      <span
                        className={`text-[9px] sm:text-[9.5px] font-semibold px-2 py-0.5 rounded-md border ${
                          isPending
                            ? "bg-slate-50 border-slate-200 text-slate-400"
                            : isCurrent
                            ? "bg-[#062E27] border-[#062E27] text-amber-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {step.meta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}