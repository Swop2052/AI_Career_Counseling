import React, { useRef, useState, useEffect } from "react";
import { Play, RotateCcw, ArrowRight } from "lucide-react";

export default function IntroVideo({ src, category, onFinish }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEnded, setIsEnded] = useState(false);

  // नवीन कॅटेगरी व्हिडिओ आल्यावर रीलोड आणि प्ले करणे
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      setIsEnded(false);
    }
  }, [src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
    setIsEnded(false);
  };

  return (
    <div className="w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/90 shadow-[0_16px_45px_-12px_rgba(6,46,39,0.12)] p-4 sm:p-6 md:p-7 flex flex-col items-center select-none qm-popup-enter">
      {/* Category Header Badge */}
      <div className="flex justify-center mb-2 sm:mb-3">
        <span
          className="text-xs sm:text-sm font-bold tracking-widest px-4 py-1 rounded-full uppercase"
          style={{
            color: "#062E27",
            background: "#CFEDED",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {category} Component
        </span>
      </div>

      <h2
        className="text-center text-base sm:text-xl md:text-2xl font-bold text-[#062E27] mb-3 sm:mb-4 tracking-wide leading-snug"
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        Discover the {category} Trait 🚀
      </h2>

      {/* Video Box */}
      <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-100 shadow-inner group mb-4 sm:mb-6">
        <video
          ref={videoRef}
          key={src}
          src={src}
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
          onEnded={handleEnded}
          playsInline
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Center Play Button Overlay */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/35 flex items-center justify-center cursor-pointer backdrop-blur-[2px] transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#062E27] text-white flex items-center justify-center shadow-2xl border-2 border-[#D4AF37] active:scale-95 transition-transform">
              <Play size={24} className="ml-1 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
        <button
          onClick={restartVideo}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <RotateCcw size={15} />
          <span>Watch Again</span>
        </button>

        <button
          onClick={onFinish}
          className="w-full flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl text-white font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider cursor-pointer shadow-[0_10px_24px_-6px_rgba(6,46,39,0.35)] active:scale-[0.99] transition-all"
          style={{
            background: "linear-gradient(180deg, #0B3B32 0%, #062E27 100%)",
            fontFamily: "'Fredoka', sans-serif",
          }}
        >
          <span>Start {category} Questions</span>
          <ArrowRight size={18} strokeWidth={2.8} className="text-[#D4AF37]" />
        </button>
      </div>
    </div>
  );
}