import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../translations/LanguageContext';

//graphics
import Graphic1 from '../../assets/graphics/graphic-1.png';
import Graphic2 from '../../assets/graphics/graphic-2.png';
import Graphic3 from '../../assets/graphics/graphic-3.png';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14, 
      delayChildren: 0.1,
    },
  },
};

const slideFromLeftVariants = {
  hidden: {
    opacity: 0,
    x: -70, 
  },
  visible: {
    opacity: 1,
    x: 0, 
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 85,
      duration: 0.8,
    },
  },
};


function VectorStar({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
    </svg>
  );
}


function VectorBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      
      <svg
        className="absolute inset-0 w-full h-full opacity-40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-vector-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" className="fill-[#04302E]/25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-vector-grid)" />
      </svg>

      
      <svg
        className="absolute top-1/2 right-[-5%] -translate-y-1/2 w-[700px] h-[700px] opacity-35"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="350" cy="350" r="120" stroke="#09A3A3" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="350" cy="350" r="220" stroke="#09A3A3" strokeWidth="1.2" strokeOpacity="0.6" />
        <circle cx="350" cy="350" r="320" stroke="#04302E" strokeWidth="1" strokeDasharray="6 8" strokeOpacity="0.4" />
        <line x1="350" y1="30" x2="350" y2="670" stroke="#09A3A3" strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.3" />
        <line x1="30" y1="350" x2="670" y2="350" stroke="#09A3A3" strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.3" />
      </svg>

      {/* Vector Spark Stars */}
      <VectorStar className="absolute top-20 left-[12%] w-5 h-5 text-[#E8B04B]/70 animate-pulse [animation-duration:3s]" />
      <VectorStar className="absolute top-1/3 left-[48%] w-3.5 h-3.5 text-[#09A3A3]/60 animate-ping [animation-duration:4s]" />
      <VectorStar className="absolute bottom-24 left-[8%] w-6 h-6 text-[#09A3A3]/40 animate-pulse [animation-duration:5s]" />
      <VectorStar className="absolute top-28 right-[14%] w-4 h-4 text-[#E8B04B]/80 animate-pulse [animation-duration:3.5s]" />
      <VectorStar className="absolute bottom-16 right-[38%] w-5 h-5 text-[#04302E]/30 animate-pulse [animation-duration:4.5s]" />

      
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#09A3A3]/15 rounded-full blur-[100px]" />
      <div className="absolute -bottom-10 right-10 w-96 h-96 bg-[#E8B04B]/15 rounded-full blur-[110px]" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-[#04302E]/10 rounded-full blur-[90px]" />
    </div>
  );
}

function CircularGraphicOrbit() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const items = [
    { src: Graphic1, alt: 'AI Insights', label: 'AI Insights' },
    { src: Graphic2, alt: 'Career Maps', label: 'Career Maps' },
    { src: Graphic3, alt: 'Match Engine', label: 'Match Engine' },
  ];

  const count = items.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 2200);
    return () => clearInterval(timer);
  }, [count]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const getCircularStyle = (index) => {
    let diff = (index - activeIndex + count) % count;
    if (diff > count / 2) diff -= count;

    const spacingX = 90;
    const spacingY = 22;
    const scaleStep = 0.09;
    const opacityStep = 0.18;

    const absDiff = Math.abs(diff);
    const isActive = diff === 0;

    const baseStyle = {
      transform: `translate3d(${diff * spacingX}px, ${absDiff * -spacingY}px, 0px) scale(${Math.max(1 - absDiff * scaleStep, 0.45)})`,
      opacity: Math.max(1 - absDiff * opacityStep, 0.15),
      zIndex: 30 - absDiff,
      filter: isActive ? 'brightness(1.05)' : `brightness(0.85) blur(${Math.min(absDiff * 0.4, 1.2)}px)`,
    };

    if (!mounted) {
      return {
        ...baseStyle,
        transform: 'translate3d(0px, 0px, 0px) scale(0.15)',
        opacity: 0,
      };
    }

    return baseStyle;
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[360px] min-[1018px]:h-[380px] xl:h-[460px] 2xl:h-[500px] flex items-center justify-center select-none">
      {items.map((item, idx) => {
        const style = getCircularStyle(idx);
        const isActive = idx === activeIndex;

        return (
          <div
            key={item.label}
            onClick={() => setActiveIndex(idx)}
            style={{
              transform: style.transform,
              opacity: style.opacity,
              zIndex: style.zIndex,
              filter: style.filter,
              transitionDelay: mounted ? '0ms' : `${idx * 120}ms`,
            }}
            className="absolute cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center group"
          >
            <img
              src={item.src}
              alt={item.alt}
              className={`w-40 sm:w-56 min-[1018px]:w-56 xl:w-72 2xl:w-80 h-auto object-contain drop-shadow-2xl transition-all duration-500 ${
                isActive ? 'scale-100' : 'scale-90 hover:opacity-90'
              }`}
            />

            <span
              className={`mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all duration-500 bg-[#04302E] text-white border border-[#09A3A3]/40 ${
                isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Navigation Indicators */}
      <div className="absolute bottom-1 flex items-center gap-1.5 z-40">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            aria-label={`Select Graphic ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === activeIndex
                ? 'w-6 bg-[#09A3A3] shadow-md shadow-[#09A3A3]/50'
                : 'w-2 bg-[#09A3A3]/30 hover:bg-[#09A3A3]/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function TypewriterText({
  text = 'the real you.',
  typingSpeed = 90,
  deletingSpeed = 50,
  pauseTime = 1800,
}) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    if (!isDeleting && displayText === text) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayText === '') {
      timeout = setTimeout(() => setIsDeleting(false), 400);
    } else {
      timeout = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting ? prev.slice(0, -1) : text.slice(0, prev.length + 1)
        );
      }, isDeleting ? deletingSpeed : typingSpeed);
    }
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, text, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className="bg-gradient-to-r from-[#09A3A3] via-[#04302E] to-[#E8B04B] bg-clip-text text-transparent">
      {displayText}
      <span className="inline-block w-[2px] md:w-[3px] h-[0.85em] align-middle ml-1 bg-[#09A3A3] animate-pulse" />
    </span>
  );
}

export default function Hero({ onStartTest }) {
  const { t, language } = useLanguage();

  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 min-[1018px]:px-10
        pt-10 sm:pt-16 min-[1018px]:pt-20 pb-12 sm:pb-20
        grid min-[1018px]:grid-cols-2
        gap-10 min-[1018px]:gap-8 xl:gap-14
        items-center"
    >
      
      <VectorBackground />

      <motion.div
        className="text-left z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      
        <motion.div
          variants={slideFromLeftVariants}
          className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wide text-[#04302E] uppercase mb-5 bg-white/90 backdrop-blur-md border border-[#09A3A3]/25 rounded-full px-4 py-1.5 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#09A3A3] animate-ping" />
          <span>{t('badge')}</span>
        </motion.div>

        <motion.h1
          variants={slideFromLeftVariants}
          className={`font-display font-bold text-[#04211F] text-4xl sm:text-4xl min-[1018px]:text-4xl xl:text-5xl 2xl:text-[3.35rem] mb-5 ${language === 'en' ? 'leading-[1.16] tracking-tight' : 'leading-[1.4] tracking-normal'}`}
        >
          <span className={`block ${language === 'en' ? '' : 'mb-3 sm:mb-4'}`}>
            {t('titlePart1')}
          </span>
          <TypewriterText text={t('titleHighlight')} />
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={slideFromLeftVariants}
          className="text-[#0B3D3D]/80 text-[12px] sm:text-base min-[1018px]:text-base xl:text-lg max-w-lg mb-8 leading-relaxed"
        >
          {t('description')}
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={slideFromLeftVariants}
          className="relative z-20 flex flex-col min-[355px]:flex-row min-[355px]:items-center gap-3.5 mb-7"
        >
          {/* Linked Test Button */}
          <button 
            type="button"
            onClick={onStartTest}
            className="group relative w-full min-[355px]:w-auto justify-center overflow-hidden rounded-full bg-[#04302E] text-white text-xs sm:text-base font-semibold px-5 py-2.5 sm:px-7 sm:py-3.5 flex items-center gap-2 shadow-lg shadow-[#04302E]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#09A3A3]/30 active:scale-[0.98] cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('startTest')}
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
          </button>

          {/* Get Career Advice Button Linked to #ai-counselor */}
          <a 
            href="#ai-counselor"
            className="group relative w-full min-[355px]:w-auto justify-center inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm text-[#04302E] text-xs sm:text-sm font-bold border border-[#09A3A3]/30 shadow-sm active:scale-[0.98] transition-all duration-300 cursor-pointer no-underline"
          >
            <span>{t('careerAdvice')}</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#04302E]/60 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </motion.div>

        {/* Trust Proof Badges */}
        <motion.div
          variants={slideFromLeftVariants}
          className="pt-5 border-t border-[#04302E]/10 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-[#0B3D3D]/75"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-[#04302E] text-[9px] font-bold text-white">JD</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-[#09A3A3] text-[9px] font-bold text-white">SK</span>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-[#E8B04B] text-[9px] font-bold text-[#04211F]">AM</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#04211F]">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
            </div>
              <span className="ml-1 text-[11px] font-bold">{t('reviews')}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Column: Orbit Visual */}
      <div className="relative w-full flex items-center justify-center z-10">
        <CircularGraphicOrbit />
      </div>
    </section>
  );
}