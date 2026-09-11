import { useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

// Special one-time screen shown right after the very first trait section
// (Q7) is completed — replaces the usual TraitPopup just this once with the
// discovery-video + an animated "you've started discovering yourself"
// message, then hands off to the next question exactly like the popup does.
export default function MilestoneReveal({ milestone, src, onContinue }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  if (!milestone) return null;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-3 sm:px-4 py-4 sm:py-6 ${milestone.phase === "exit" ? "qm-overlay-exit" : "qm-overlay-enter"}`}>
      <div className={`relative w-full max-w-lg sm:max-w-xl bg-white rounded-[1.75rem] shadow-2xl max-h-[92vh] overflow-y-auto ${milestone.phase === "exit" ? "qm-popup-exit" : "qm-popup-enter"}`}>
        <div className="px-4 sm:px-6 pt-6 pb-6 text-center">
          {/* Animated headline */}
          <div className="relative flex items-center justify-center gap-2 mb-1.5">
            <Sparkles size={18} className="qm-sparkle" style={{ color: "#8B5CF6" }} strokeWidth={2.5} />
            <h3
              className="qm-shimmer-text text-[22px] sm:text-2xl font-extrabold"
              style={{ fontFamily: "'Baloo 2', sans-serif" }}
            >
              You've Started Discovering Yourself!
            </h3>
            <Sparkles size={18} className="qm-sparkle" style={{ color: "#8B5CF6", animationDelay: ".4s" }} strokeWidth={2.5} />
          </div>

          <p
            className="qm-fade-up text-slate-500 font-bold text-[13px] sm:text-sm mb-5"
            style={{ animationDelay: ".12s" }}
          >
            Every answer brings you closer to understanding your unique strengths.
          </p>

          {/* Video */}
          <div className="qm-fade-up w-full rounded-[1.5rem] overflow-hidden shadow-xl bg-black relative aspect-video" style={{ animationDelay: ".2s" }}>
            <video
              ref={videoRef}
              src={src}
              autoPlay
              muted={muted}
              playsInline
              controls={false}
              className="w-full h-full object-cover block"
            />

            <span className="qm-glow-pulse pointer-events-none absolute -inset-6 rounded-[2rem]" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }} />

            <button
              type="button"
              onClick={toggleMute}
              className="absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md active:scale-90 transition-transform text-base sm:text-lg"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          <button
            onClick={() => onContinue(true)}
            className="qm-fade-up mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-extrabold text-base shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-[3px] transition-all"
            style={{ background: "#8B5CF6", fontFamily: "'Baloo 2', sans-serif", animationDelay: ".28s" }}
          >
            Continue <ArrowRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
