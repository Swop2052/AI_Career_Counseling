import React, { useState, useEffect } from "react";

const FUN_MASCOT_QUOTES = [
  "You're on fire! Keep that momentum going!",
  "Ooh, great choice! Your real talents are showing up!",
  "Look at you go! A true future superstar in the making!",
  "Trust your gut! Every question is unlocking your superpower!",
  "High five! You're doing absolutely amazing!",
  "Brilliant! The career world isn't ready for your genius!",
];

export default function MascotBubble({ mascot, onDismiss, color, tint }) {
  if (!mascot) return null;
  const brandColor = color || "#3B82F6"; // Blue theme for new robot mascot

  const [activeMessage, setActiveMessage] = useState("");

  useEffect(() => {
    if (mascot.message) {
      setActiveMessage(mascot.message);
    } else {
      const randomMsg =
        FUN_MASCOT_QUOTES[Math.floor(Math.random() * FUN_MASCOT_QUOTES.length)];
      setActiveMessage(randomMsg);
    }
  }, [mascot]);

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none select-none">
      <div
        className={`pointer-events-auto flex items-end gap-3 sm:gap-4 cursor-pointer ${
          mascot.phase === "exit" ? "qm-mascot-exit" : "qm-mascot-enter"
        }`}
        onClick={onDismiss}
      >
        {/* Interactive Speech Bubble */}
        <div
          className="qm-bubble-in relative mb-10 bg-white border-2 border-slate-100 rounded-3xl p-4 sm:p-5 shadow-[0_14px_35px_-8px_rgba(0,0,0,0.22)] max-w-[220px] sm:max-w-[270px] transition-transform hover:scale-[1.02]"
          style={{
            borderBottomColor: brandColor,
            borderBottomWidth: "5px",
          }}
        >
          {/* Power Tip Tag */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-500"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Power Tip!
            </span>
          </div>

          {/* Dynamic Message */}
          <p
            className="font-bold text-slate-800 text-xs sm:text-[13.5px] leading-snug tracking-wide"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {activeMessage}
          </p>

          {/* Speech Bubble Arrow Tail */}
          <span
            className="absolute -bottom-[9px] right-7 sm:right-9 w-4 h-4 bg-white rotate-45 border-r-2 border-b-2"
            style={{
              borderBottomColor: brandColor,
              borderRightColor: brandColor,
            }}
          />
        </div>

        {/* Robot Mascot Image Container (3D Animated, no flat background) */}
        <div
          className="relative shrink-0"
          style={{ transformOrigin: "bottom center", perspective: "800px" }}
        >
          {/* Idle squash & stretch (vertical bounce) */}
          <div
            className="qm-mascot-squash relative"
            style={{ transformOrigin: "bottom center" }}
          >
            {/* Continuous 3D tilt/rotation for real depth */}
            <div className="qm-mascot-3d" style={{ transformStyle: "preserve-3d" }}>
              <img
                src="/images/mascot-2.png"
                alt="Mascot Robot"
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain relative z-10"
              />
            </div>
          </div>

          {/* Floating Sparkles around mascot */}
          <span
            className="qm-mascot-spark absolute -top-4 -left-3 text-xl"
            style={{ color: brandColor }}
          >
            ✦
          </span>
          <span
            className="qm-mascot-spark absolute top-0 -right-4 text-lg"
            style={{ color: "#F59E0B", animationDelay: "0.3s" }}
          >
            ✦
          </span>
        </div>
      </div>
    </div>
  );
}