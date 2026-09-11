import React from 'react';
import { Compass } from 'lucide-react';
import { FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';

const SOCIALS = [
  { icon: FaInstagram, href: 'https://instagram.com' },
  { icon: FaLinkedin, href: 'https://linkedin.com' },
  { icon: FaYoutube, href: 'https://youtube.com' }
];

export default function Footer({ 
  onStartTest, 
  onOpenCounselor, 
  onHomeClick 
}) {

  // होमपेजवरील कोणत्याही विशिष्ट सेक्शनवर जाण्यासाठी
  const handleNavigateToSection = (e, sectionId) => {
    e.preventDefault();
    if (onHomeClick) onHomeClick();

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.hash = sectionId;
      }
    }, 120);
  };

  // लिंकनुसार योग्य ॲक्शन ट्रिगर करणे
  const handleLinkClick = (e, item) => {
    e.preventDefault();

    if (item === 'Take Test' || item === 'Start Career Test') {
      if (onStartTest) {
        onStartTest();
      } else {
        window.location.hash = 'test';
      }
    } else if (item === 'AI Counselor') {
      if (onOpenCounselor) {
        onOpenCounselor();
      } else {
        window.location.hash = 'ai-counselor';
      }
    } else if (item === 'Contact') {
      handleNavigateToSection(e, 'contact');
    } else if (item === 'Career Advice') {
      handleNavigateToSection(e, 'how-it-works');
    }
  };

  const FOOTER_COLUMNS = [
    {
      h: 'EXPLORE',
      items: ['Take Test', 'AI Counselor', 'Contact'],
    },
    {
      h: 'RESOURCES',
      items: ['Career Advice'],
    },
    {
      h: 'GET STARTED',
      items: ['Start Career Test'],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#04211F] text-[#CFEDED]/80 px-5 md:px-10 pt-16 pb-8">
      <div className="pointer-events-none absolute -top-32 left-1/3 w-96 h-96 rounded-full bg-[#09A3A3]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-10 w-72 h-72 rounded-full bg-[#E8B04B]/10 blur-[100px]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col md:grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand block */}
          <div>
            <div 
              onClick={(e) => {
                e.preventDefault();
                if (onHomeClick) onHomeClick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 mb-4 cursor-pointer w-fit group select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#09A3A3] to-[#0ecccc] flex items-center justify-center shadow-lg shadow-[#09A3A3]/30 transition-transform group-hover:scale-105">
                <Compass className="w-5 h-5 text-[#04211F]" />
              </div>
              <span className="font-display font-semibold text-lg text-white group-hover:text-[#09A3A3] transition-colors">
                SkillSense
              </span>
            </div>
            
            <p className="text-sm leading-relaxed max-w-xs text-[#CFEDED]/50 mb-5">
              A trusted career guidance platform helping students discover their strengths, explore opportunities, and build a roadmap for their future.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {SOCIALS.map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[#CFEDED]/60 hover:text-[#04211F] hover:bg-[#09A3A3] hover:border-[#09A3A3] transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:contents">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.h}>
                <div className="text-xs font-semibold tracking-widest text-[#CFEDED]/35 mb-4">
                  {col.h}
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  {col.items.map((it) => (
                    <button
                      key={it}
                      type="button"
                      onClick={(e) => handleLinkClick(e, it)}
                      className="text-[#CFEDED]/65 hover:text-white transition-colors duration-200 text-left w-fit cursor-pointer"
                    >
                      {it}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#CFEDED]/35">
          <span>© 2026 SkillSense. Built for curious students.</span>
        </div>
      </div>
    </footer>
  );
}