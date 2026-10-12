import React from 'react';
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

  const handleNavigateToSection = (e, sectionId) => {
    e.preventDefault();
    if (onHomeClick) onHomeClick();

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = `/#${sectionId}`;
      }
    }, 120);
  };

  const handleLinkClick = (e, item) => {
    e.preventDefault();

    if (item === 'Take Test' || item === 'Start Career Test') {
      if (onStartTest) {
        onStartTest();
      } else {
        window.location.hash = 'onboarding';
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

  return (
    <footer className="relative overflow-hidden bg-[#04211F] text-[#CFEDED]/80 px-5 md:px-10 pt-16 pb-8">
      <div className="pointer-events-none absolute -top-32 left-1/3 w-96 h-96 rounded-full bg-[#09A3A3]/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-10 w-72 h-72 rounded-full bg-[#E8B04B]/10 blur-[100px]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.3fr_1fr_1fr] gap-10 mb-12">
          {/* Brand block */}
          <div>
            <div 
              onClick={(e) => {
                e.preventDefault();
                if (onHomeClick) onHomeClick();
                else window.location.href = '/';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1 mb-4 cursor-pointer w-fit group select-none transition-transform hover:scale-[1.02] active:scale-95 bg-white/95 hover:bg-white rounded-2xl px-3 py-1.5 shadow-sm"
              title="Return to Home"
            >
              <img 
                src="/logo.png" 
                alt="SkillSense Icon" 
                className="h-[36px] w-auto object-contain mix-blend-multiply drop-shadow-xs" 
                draggable="false"
              />
              <img 
                src="/logo1.png" 
                alt="SkillSense Typography" 
                className="h-[24px] w-auto object-contain mix-blend-multiply drop-shadow-xs" 
                draggable="false"
              />
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

          {/* Column 1: CAREER GUIDES (Internal SEO Links) */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-[#CFEDED]/40 uppercase mb-4">
              Career Guides
            </div>
            <div className="flex flex-col gap-2.5 text-sm">
              <a 
                href="/after-10th-career-guidance" 
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200"
              >
                Which Stream After 10th?
              </a>
              <a 
                href="/after-12th-science-career-options" 
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200"
              >
                Career Options After 12th Science
              </a>
              <a 
                href="/career-test-for-commerce-students" 
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200"
              >
                Commerce Student Career Test
              </a>
            </div>
          </div>

          {/* Column 2: EXPLORE */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-[#CFEDED]/40 uppercase mb-4">
              Explore
            </div>
            <div className="flex flex-col gap-2.5 text-sm">
              <button
                type="button"
                onClick={(e) => handleLinkClick(e, 'Take Test')}
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200 text-left w-fit cursor-pointer"
              >
                Free Aptitude Test
              </button>
              <button
                type="button"
                onClick={(e) => handleLinkClick(e, 'AI Counselor')}
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200 text-left w-fit cursor-pointer"
              >
                VERA AI Counselor
              </button>
              <button
                type="button"
                onClick={(e) => handleLinkClick(e, 'Contact')}
                className="text-[#CFEDED]/70 hover:text-white transition-colors duration-200 text-left w-fit cursor-pointer"
              >
                Contact & Support
              </button>
            </div>
          </div>

          {/* Column 3: ABOUT AISENSE */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-[#CFEDED]/40 uppercase mb-4">
              About Platform
            </div>
            <div className="flex flex-col gap-2.5 text-sm text-[#CFEDED]/60">
              <span>Incubated at SINE IIT Bombay</span>
              <span>AiSense LLP, Maharashtra</span>
              <a 
                href="mailto:support@skillsense.aisense.co.in" 
                className="hover:text-white transition-colors"
              >
                support@skillsense.aisense.co.in
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#CFEDED]/40">
          <span>&copy; {new Date().getFullYear()} SkillSense by AiSense LLP. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/#terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
