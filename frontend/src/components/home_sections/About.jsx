import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../Reveal';
import { useLanguage } from '../../translations/LanguageContext';

import logicImg from '../../assets/logic.png';
import creativityImg from '../../assets/creativity.png';
import empathyImg from '../../assets/empathy.jpg';
import leadershipImg from '../../assets/leadership.png';
import curiosityImg from '../../assets/curiosity.png';
import disciplineImg from '../../assets/discipline.png';

// Bubble border-radius shapes
const BUBBLE_SHAPES = [
  '55% 45% 62% 38% / 40% 58% 42% 60%',
  '42% 58% 38% 62% / 58% 42% 58% 42%',
  '52% 48% 64% 36% / 44% 56% 44% 56%',
  '38% 62% 48% 52% / 52% 38% 62% 48%',
  '62% 38% 42% 58% / 46% 54% 46% 54%',
  '46% 54% 58% 42% / 56% 44% 56% 44%',
];

const getDimensions = (t) => [
  {
    name: t('logicTitle'),
    imageUrl: logicImg,
    desc: t('logicDesc'),
  },
  {
    name: t('creativityTitle'),
    imageUrl: creativityImg,
    desc: t('creativityDesc'),
  },
  {
    name: t('empathyTitle'),
    imageUrl: empathyImg,
    desc: t('empathyDesc'),
  },
  {
    name: t('leadershipTitle'),
    imageUrl: leadershipImg,
    desc: t('leadershipDesc'),
  },
  {
    name: t('curiosityTitle'),
    imageUrl: curiosityImg,
    desc: t('curiosityDesc'),
  },
  {
    name: t('disciplineTitle'),
    imageUrl: disciplineImg,
    desc: t('disciplineDesc'),
  },
];

// Card entrance animation
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.8,
    rotate: -6,
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.1,
      type: 'spring',
      stiffness: 260,
      damping: 18,
      mass: 0.9,
    },
  }),
};

// Bubble float animation
const floatVariants = {
  hidden: { y: 0 },
  visible: (i) => ({
    y: [0, -8, 0],
    transition: {
      duration: 3 + (i % 3) * 0.4,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: i * 0.15,
    },
  }),
};

export default function About() {
  const { t } = useLanguage();
  const dimensions = getDimensions(t);

  return (
    <section
      id="about"
      className="scroll-mt-12 relative bg-white pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 md:px-10"
    >
      <svg
        className="absolute left-0 right-0 bottom-full w-full h-[40px] sm:h-[80px] md:h-[120px] text-white pointer-events-none"
        viewBox="0 0 1440 130"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M0,80 C180,20 360,110 600,70 C840,30 1020,120 1260,60 C1350,38 1410,45 1440,55 L1440,130 L0,130 Z" />
      </svg>

      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-10 sm:mb-16">
          <div className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#078686] uppercase mb-2 sm:mb-3">
            {t('aboutBadge')}
          </div>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-[#04211F] tracking-tight">
           {t('aboutHeading')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#0B3D3D]/65 mt-3 max-w-2xl mx-auto leading-relaxed">
           {t('aboutDesc')}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={cardVariants}
              whileHover={{
                y: -10,
                scale: 1.03,
                transition: { type: 'spring', stiffness: 300, damping: 15 },
              }}
              className="h-full transform-gpu"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="group relative bg-[#EAF6FD]/60 hover:bg-white rounded-3xl p-6 border border-[#09A3A3]/15 hover:border-[#09A3A3]/35 transition-[background-color,border-color,box-shadow] duration-300 hover:shadow-xl hover:shadow-[#09A3A3]/15 h-full flex flex-col justify-between overflow-hidden">

                {/* Hover glow ring */}
                <div
                  className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 0%, rgba(9,163,163,0.25), transparent 70%)',
                  }}
                />

                <div className="relative z-10">
                  {/* Bubble image */}
                  <div className="w-full flex items-center justify-center mb-5">
                    <motion.div
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: false, amount: 0.4 }}
                      variants={floatVariants}
                      className="relative w-44 h-44 sm:w-52 sm:h-52 overflow-hidden isolate shadow-lg shadow-[#09A3A3]/20 border-2 border-white/80 group-hover:shadow-xl group-hover:shadow-[#09A3A3]/25 group-hover:scale-110 group-hover:rotate-2 transition-[box-shadow,transform] duration-500 ease-out"
                      style={{
                        borderRadius: BUBBLE_SHAPES[i % BUBBLE_SHAPES.length],
                        willChange: 'transform',
                      }}
                    >
                      <img
                        src={dim.imageUrl}
                        alt={dim.name}
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Gloss overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 pointer-events-none" />

                      {/* Inner shadow */}
                      <div className="absolute inset-0 shadow-inner shadow-black/10 pointer-events-none" />

                      {/* Shine on hover */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background:
                            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.55) 45%, transparent 60%)',
                          transform: 'translateX(-60%)',
                        }}
                      />
                    </motion.div>
                  </div>

                  <h3 className="font-display font-semibold text-lg sm:text-xl text-[#04211F] mb-1.5 group-hover:text-[#09A3A3] group-hover:translate-x-0.5 transition-[color,transform] duration-200">
                    {dim.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0B3D3D]/70 leading-relaxed">
                    {dim.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}