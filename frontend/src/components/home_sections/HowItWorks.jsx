import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import Reveal from '../Reveal';
import demoVideo from '../../assets/demo_video.mp4';
import notebookIcon from '../../assets/notebook.png';
import mindIcon from '../../assets/mind.png';
import roadmapIcon from '../../assets/roadmap.png';

const STEPS = [
  {
    icon: notebookIcon,
    title: 'Take Assessment',
    time: '10 min',
    desc: 'Answer fun, easy questions about yourself — there are no wrong answers!',
  },
  {
    icon: mindIcon,
    title: 'Prepare Your Mind, Body and Soul',
    time: 'Instant',
    desc: 'Our AI studies your personality, interests, and strengths to build your profile.',
  },
  {
    icon: roadmapIcon,
    title: 'Personalised Roadmap',
    time: 'Anytime',
    desc: 'See careers, subjects, and a roadmap made just for you.',
  },
];

// Card flip-in animation when scrolled into view
function FoldStep({ children, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        perspective: '1200px',
      }}
    >
      <div
        className="transition-all ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'top center',
          transitionDuration: '650ms',
          transitionDelay: visible ? `${index * 220}ms` : '0ms',
          transitionTimingFunction: visible
            ? 'cubic-bezier(0.22, 1, 0.36, 1)'
            : 'ease-in',
          transform: visible
            ? 'rotateX(0deg) translateY(0)'
            : 'rotateX(-90deg) translateY(-8px)',
          opacity: visible ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-15 relative bg-[#CFEDED] pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 md:px-10"
    >
      {/* Top wave */}
      <svg
        className="absolute left-0 right-0 bottom-full w-full h-[40px] sm:h-[80px] md:h-[120px] text-[#CFEDED]"
        viewBox="0 0 1440 130"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M0,80 C180,20 360,110 600,70 C840,30 1020,120 1260,60 C1350,38 1410,45 1440,55 L1440,130 L0,130 Z" />
      </svg>

      {/* Background glow */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-[#09A3A3]/15 blur-[90px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal className="text-center mb-6 sm:mb-10">
          <div className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#078686] uppercase mb-2 sm:mb-3">
            The Process
          </div>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-[#04211F] tracking-tight">
            Three easy steps to your future
          </h2>
          <p className="text-sm sm:text-base text-[#0B3D3D]/65 mt-2 sm:mt-3 max-w-md mx-auto">
           Instantly see your top career choices, required college degrees, course budgets, and the exact steps to get there. 

          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Video */}
          <Reveal className="relative">
            <div className="absolute -inset-3 sm:-inset-4 rounded-[2rem] bg-gradient-to-br from-[#09A3A3] via-[#0B7A7A] to-[#04302E] -z-10" />
            <div className="absolute -top-6 -left-6 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#E8B04B]/30 blur-2xl -z-10" />
            <div className="absolute -bottom-8 -right-8 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white/20 blur-2xl -z-10" />
            <div className="hidden sm:block absolute -inset-1.5 rounded-[1.75rem] border-2 border-dashed border-white/25 -z-10" />

            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-[#04302E]/30 border-4 border-white/80 aspect-video bg-[#04211F]">
              <video
                className="w-full h-full object-cover"
                src={demoVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </Reveal>

          {/* Steps */}
          <div className="relative flex flex-col gap-5 sm:gap-6">
            {/* Line connecting steps */}
            <div className="hidden sm:block absolute top-6 bottom-6 left-6 border-l-2 border-dashed border-[#09A3A3]/25" />

            {STEPS.map((s, i) => (
              <FoldStep key={s.title} index={i}>
                <div className="relative flex gap-4 sm:gap-5 bg-white hover:bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#09A3A3]/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#09A3A3]/15">
                  {/* Step icon */}
                  <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full z-10 overflow-hidden border border-[#074643]">
                    <img
                      src={s.icon}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover rounded-full"
                    />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E8B04B] ring-2 ring-white animate-pulse" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-semibold text-[#09A3A3] mb-1">
                      STEP {i + 1}
                    </div>
                    <h3 className="font-display font-semibold text-base sm:text-lg text-[#04211F] mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#0B3D3D]/65 leading-relaxed mb-3">
                      {s.desc}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#078686] bg-[#CFEDED]/50 px-2.5 py-1 rounded-full border border-[#09A3A3]/15 shadow-xs">
                      <Clock className="w-3 h-3" /> {s.time}
                    </span>
                  </div>
                </div>
              </FoldStep>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}