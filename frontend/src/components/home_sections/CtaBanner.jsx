import React from 'react';
import { Sparkles, Star, ChevronRight } from 'lucide-react';
import Reveal from '../Reveal';
import { useLanguage } from '../../translations/LanguageContext';

export default function CtaBanner({ onStartTest }) {
  const { t } = useLanguage();

  return (
    <section className="relative px-4 sm:px-6 md:px-10 py-12 sm:py-16 bg-[#CFEDED]">
     
      <Reveal>
        <div className="relative max-w-6xl mx-auto rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#04302E] via-[#04302E] to-[#066b6b] text-white px-5 sm:px-10 md:px-16 py-10 sm:py-16 text-center overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-[#09A3A3]/25 blur-[60px] sm:blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-[#E8B04B]/15 blur-[60px] sm:blur-[100px]" />

         

          <h2 className="relative font-display font-semibold text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 tracking-tight">
            {t('ctaHeading')}
          </h2>
          <p className="relative text-xs sm:text-sm md:text-base text-white/70 max-w-md mx-auto mb-6 sm:mb-8">
            {t('ctaDesc')}
          </p>

          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button 
              type="button"
              onClick={onStartTest}
              className="group relative w-full sm:w-auto overflow-hidden rounded-full bg-white text-[#04302E] text-sm sm:text-base font-bold px-6 py-3 sm:px-8 sm:py-3.5 shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <span className="relative z-10">{t('ctaButton')}</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-[#CFEDED]/60 to-transparent skew-x-12" />
            </button>
            <button className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1 py-1 cursor-pointer">
              {t('sampleReport')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}