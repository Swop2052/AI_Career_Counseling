import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../translations/LanguageContext';
import {
  Compass, Menu, X, Globe, ChevronDown, Check, User, Settings, LogOut, HelpCircle, LogIn, UserPlus,
  LayoutDashboard, ShieldCheck
} from 'lucide-react';
import { isSuperAdmin, isDeveloper } from '../../utils/roleUtils';
import { resolveAvatarUrl } from '../../utils/avatarUtils';

const LANGUAGES = [
  { code: 'EN', label: 'English', accent: '#09A3A3' },
  { code: 'HI', label: 'हिंदी', accent: '#E8B04B' },
  { code: 'MR', label: 'मराठी', accent: '#09A3A3' },
];

function Dynamic3DCompassLogo({ onHomeClick }) {
  return (
    <div 
      onClick={onHomeClick} 
      className="group flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-95 pl-1"
    >
      <img 
        src="/logo.png" 
        alt="SkillSense Icon" 
        className="h-[46px] w-auto object-contain mix-blend-multiply drop-shadow-sm" 
        draggable="false"
      />
      <img 
        src="/logo1.png" 
        alt="SkillSense Typography" 
        className="h-[28px] sm:h-[32px] w-auto object-contain mix-blend-multiply drop-shadow-sm mt-1" 
        draggable="false"
      />
    </div>
  );
}

function LanguageDropdown({ compact }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const currentLangObj = LANGUAGES.find(l => l.code.toLowerCase() === language) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'} rounded-xl border-t border-l border-b border-r shadow-[0_3px_6px_rgba(4,48,46,0.08),inset_0_1px_0_rgba(255,255,255,1)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-0.5 text-xs font-bold transition-all duration-150 bg-gradient-to-b from-white to-[#edf3f3] border-white border-b-[#c2d3d2] text-[#04211F] cursor-pointer`}
      >
        <Globe className="w-3.5 h-3.5 text-[#09A3A3]" />
        <span>{currentLangObj.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-[#0B3D3D]/60`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-40 rounded-2xl border py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 bg-white border-white/80 shadow-[0_12px_30px_rgba(4,48,46,0.18),0_4px_8px_rgba(0,0,0,0.06)]">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangObj.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code.toLowerCase());
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#09A3A3]/15 to-transparent text-[#04302E] font-bold border-l-2 border-[#09A3A3]'
                    : 'text-[#0B3D3D]/70 hover:bg-[#04302E]/5 hover:text-[#04302E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: lang.accent }}
                  />
                  <span>{lang.label}</span>
                  <span className="text-[10px] font-normal text-gray-400">({lang.code})</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#09A3A3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AvatarBadge({ size = 'md', user }) {
  const dims = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs';
  const initials = user?.initials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'SK');
  const avatar = resolveAvatarUrl(user?.avatar || user?.profilePhoto) || (user?.profilePhoto && typeof user.profilePhoto === 'string' && user.profilePhoto.startsWith('data:') ? user.profilePhoto : null);
  
  return (
    <div
      className={`relative ${dims} shrink-0 rounded-full bg-gradient-to-b from-[#0f5a56] via-[#04302e] to-[#021c1b] flex items-center justify-center border-t border-l border-white/30 border-b border-r border-black/40 shadow-[0_4px_10px_rgba(4,48,46,0.3),inset_0_1px_1px_rgba(255,255,255,0.35)] overflow-hidden`}
    >
      {avatar ? (
        <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
      ) : (
        <span className="font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
          {initials}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3ecf8e] border-2 border-white shadow-sm z-10" />
    </div>
  );
}

function ProfileDropdown({ compact, onOpenProfile, onOpenDeveloper, onOpenAdmin, onLogout, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenProfile) onOpenProfile();
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className={`flex items-center gap-2 ${compact ? 'pl-1 pr-1' : 'pl-1.5 pr-2.5'} py-1 rounded-full border-t border-l border-b border-r active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-0.5 transition-all duration-150 bg-gradient-to-b from-white to-[#edf3f3] border-white border-b-[#c2d3d2] shadow-[0_3px_6px_rgba(4,48,46,0.08),inset_0_1px_0_rgba(255,255,255,1)] cursor-pointer`}
      >
        <AvatarBadge size="sm" user={user} />
        <span className="hidden xl:block text-xs font-bold max-w-[100px] truncate text-[#04211F]">
          {user?.name ? user.name.split(' ')[0] : 'Profile'}
        </span>
        <ChevronDown className={`hidden xl:block w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-[#0B3D3D]/60`} />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute right-0 mt-3 w-56 rounded-2xl border py-2 z-[110] bg-white border-white/80 shadow-[0_12px_35px_rgba(4,48,46,0.25),0_4px_10px_rgba(0,0,0,0.1)]"
        >
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-[#04302E]/10 cursor-pointer hover:bg-[#04302E]/5 transition-colors"
          >
            <AvatarBadge user={user} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate text-[#04211F]">{user?.name || 'User'}</p>
              <p className="text-[10px] truncate text-[#0B3D3D]/50">{user?.email || ''}</p>
            </div>
          </div>

          <div className="py-1.5">
            <button
              type="button"
              onClick={handleProfileClick}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all text-[#0B3D3D]/75 hover:bg-[#04302E]/5 hover:text-[#04302E] cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#09A3A3]" />
              <span>My Profile</span>
            </button>

            {isSuperAdmin(user) ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    if (onOpenAdmin) onOpenAdmin();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold transition-all text-[#04302E] hover:bg-[#04302E]/10 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#04302E]" />
                  <span>Super Admin Console</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    if (onOpenDeveloper) onOpenDeveloper();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold transition-all text-[#09A3A3] hover:bg-[#09A3A3]/10 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#09A3A3]" />
                  <span>Developer Dashboard</span>
                </button>
              </>
            ) : isDeveloper(user) ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onOpenDeveloper) onOpenDeveloper();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold transition-all text-[#09A3A3] hover:bg-[#09A3A3]/10 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#09A3A3]" />
                <span>Developer Dashboard</span>
              </button>
            ) : null}

            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all text-[#0B3D3D]/75 hover:bg-[#04302E]/5 hover:text-[#04302E] cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#09A3A3]" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all text-[#0B3D3D]/75 hover:bg-[#04302E]/5 hover:text-[#04302E] cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#09A3A3]" />
              <span>Help & Support</span>
            </button>
          </div>

          <div className="pt-1.5 mt-1 border-t border-[#04302E]/10">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold text-[#e0574a] hover:bg-[#c0392b]/10 transition-all cursor-pointer rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ 
  onOpenProfile, 
  onOpenCounselor, 
  onHomeClick, 
  onOpenLogin, 
  onOpenSignup, 
  onOpenDeveloper,
  onOpenAdmin,
  onStartCareerTest,
  isLoggedIn = false,
  user = null,
  onLogout
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [hoverStyle, setHoverStyle] = useState({ opacity: 0, left: 0, width: 0 });
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMouseEnter = (e) => {
    const target = e.currentTarget;
    const navRect = navRef.current.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    setHoverStyle({
      opacity: 1,
      left: targetRect.left - navRect.left,
      width: targetRect.width,
    });
  };

  const handleMouseLeave = () => {
    setHoverStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  // 1. Home ला जाण्यासाठी - टॉपला स्क्रोल करेल
  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (onHomeClick) onHomeClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. इतर Sections (About, How it works, Contact) वर अचूक जाण्यासाठी
  const handleScrollToSection = (e, sectionId) => {
    if (e) e.preventDefault();
    
    // जर आपण वेगळ्या पेजवर असू (उदा. Profile, Report, इत्यादी) तर आधी होमपेज सेट करू
    if (onHomeClick) onHomeClick();

    // DOM वर होम पेजचा तो घटक लोड होण्यासाठी १०-१२० ms वाट पाहून स्क्रोल करू
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: window.location hash द्वारे
        window.location.hash = sectionId;
      }
    }, 120);
  };

  return (
    <header className={`fixed left-0 right-0 z-[90] transition-all duration-500 ease-out px-2.5 xs:px-3 sm:px-6 md:px-10 ${scrolled ? 'top-1.5 sm:top-3' : 'top-2 sm:top-5'} pointer-events-none`}>
      <div
        className={`max-w-7xl mx-auto rounded-xl sm:rounded-3xl transition-all duration-500 flex items-center justify-between gap-2 pointer-events-auto ${
          scrolled
            ? 'py-1.5 px-2.5 sm:py-2.5 sm:px-5 backdrop-blur-2xl border-t border-l border-b bg-[#ffffff]/90 shadow-[0_20px_40px_rgba(4,48,46,0.12),0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] border-white border-b-slate-200/80'
            : 'py-2 px-3 sm:py-3.5 sm:px-6 backdrop-blur-xl border-t border-l border-b bg-[#ffffff]/75 shadow-[0_12px_32px_rgba(4,48,46,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] border-white/90 border-b-slate-200/60'
        }`}
      >
        <Dynamic3DCompassLogo onHomeClick={handleGoHome} />

        {/* Desktop Nav Items */}
        <nav
          ref={navRef}
          onMouseLeave={handleMouseLeave}
          className="hidden lg:flex items-center relative rounded-2xl p-1.5 border bg-[#04302E]/[0.05] border-[#04302E]/[0.04] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.8)]"
        >
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl border-t transition-all duration-300 ease-out pointer-events-none bg-gradient-to-b from-white to-[#f7faf9] shadow-[0_4px_10px_rgba(4,48,46,0.12),0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border-white"
            style={{
              left: `${hoverStyle.left}px`,
              width: `${hoverStyle.width}px`,
              opacity: hoverStyle.opacity,
            }}
          />

          {/* 1. Home Link */}
          <button
            type="button"
            onClick={handleGoHome}
            onMouseEnter={handleMouseEnter}
            className="relative z-10 px-3.5 xl:px-4 py-1.5 text-sm font-bold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap text-[#0B3D3D]/80 hover:text-[#04211F] cursor-pointer"
          >
            Home
          </button>

          {/* 2. About Link */}
          <a
            href="#about"
            onClick={(e) => handleScrollToSection(e, 'about')}
            onMouseEnter={handleMouseEnter}
            className="relative z-10 px-3.5 xl:px-4 py-1.5 text-sm font-bold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap text-[#0B3D3D]/80 hover:text-[#04211F]"
          >
            About
          </a>

          {/* 3. How it works Link */}
          <a
            href="#how-it-works"
            onClick={(e) => handleScrollToSection(e, 'how-it-works')}
            onMouseEnter={handleMouseEnter}
            className="relative z-10 px-3.5 xl:px-4 py-1.5 text-sm font-bold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap text-[#0B3D3D]/80 hover:text-[#04211F]"
          >
            How it works
          </a>

          {/* 4. AI Counselor Link */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenCounselor) onOpenCounselor();
            }}
            onMouseEnter={handleMouseEnter}
            className="relative z-10 px-3.5 xl:px-4 py-1.5 text-sm font-bold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap text-[#078686] hover:text-[#04211F] cursor-pointer"
          >
            AI Counselor
          </button>

          {/* 5. Contact Link */}
          <a
            href="#contact"
            onClick={(e) => handleScrollToSection(e, 'contact')}
            onMouseEnter={handleMouseEnter}
            className="relative z-10 px-3.5 xl:px-4 py-1.5 text-sm font-bold transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap text-[#0B3D3D]/80 hover:text-[#04211F]"
          >
            Contact
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          <LanguageDropdown />

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onStartCareerTest) onStartCareerTest();
            }}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-b from-[#084b48] via-[#04302E] to-[#021a19] px-4 xl:px-6 py-2.5 text-sm font-bold text-white border-t border-l border-white/30 border-b border-black/40 shadow-[0_8px_20px_rgba(4,48,46,0.35),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.35)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(9,163,163,0.3),0_3px_6px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-[0_2px_4px_rgba(4,48,46,0.3),inset_0_2px_4px_rgba(0,0,0,0.4)] whitespace-nowrap cursor-pointer"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Start Career Test</span>
          </button>

          <span className="w-px h-7 bg-[#04302E]/10" />

          {/* Conditional Auth Rendering */}
          {isLoggedIn ? (
            <ProfileDropdown 
              onOpenProfile={onOpenProfile} 
              onOpenDeveloper={onOpenDeveloper} 
              onOpenAdmin={onOpenAdmin} 
              onLogout={onLogout} 
              user={user} 
            />
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Log In Button */}
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-[#04302E] bg-white/90 border border-[#c2d3d2] shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-[#09A3A3] hover:text-[#09A3A3] hover:bg-white active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              >
                Log In
              </button>

              {/* Sign Up Button */}
              <button
                type="button"
                onClick={onOpenSignup}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-[#04302E] bg-white/90 border border-[#c2d3d2] shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:border-[#09A3A3] hover:text-[#09A3A3] hover:bg-white active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1 xs:gap-1.5 lg:hidden shrink-0">
          {isLoggedIn && (
            <ProfileDropdown 
              compact 
              onOpenProfile={onOpenProfile} 
              onOpenDeveloper={onOpenDeveloper} 
              onOpenAdmin={onOpenAdmin} 
              onLogout={onLogout} 
              user={user} 
            />
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-t border-l border-b active:translate-y-0.5 active:shadow-none shrink-0 bg-gradient-to-b from-white to-[#edf3f3] border-white border-b-[#c2d3d2] shadow-[0_4px_8px_rgba(0,0,0,0.06)] text-[#04302E]"
          >
            {menuOpen ? <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden mt-1.5 sm:mt-2 mx-auto max-w-7xl rounded-xl sm:rounded-3xl backdrop-blur-2xl border-t border-l border-b overflow-hidden transition-all duration-300 ease-in-out bg-white/95 border-white border-b-slate-200 shadow-[0_20px_40px_rgba(4,48,46,0.18)] ${
          menuOpen ? 'max-h-[600px] opacity-100 p-3.5 sm:p-5 pointer-events-auto' : 'max-h-0 opacity-0 p-0 border-transparent pointer-events-none invisible'
        }`}
      >
        <div className="flex flex-col gap-2.5 sm:gap-3.5">
          {isLoggedIn ? (
            <div 
              onClick={() => { setMenuOpen(false); onOpenProfile && onOpenProfile(); }}
              className="flex items-center gap-3 pb-3 border-b border-[#04302E]/10 cursor-pointer"
            >
              <AvatarBadge user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold truncate text-[#04211F]">{user?.name || 'User'}</p>
                <p className="text-[11px] truncate text-[#0B3D3D]/50">{user?.email || ''}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pb-3 border-b border-[#04302E]/10">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenLogin && onOpenLogin(); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#04302E] bg-white border border-[#c2d3d2] shadow-sm hover:border-[#09A3A3] hover:text-[#09A3A3] transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </button>

              <span className="text-xs font-bold text-[#0B3D3D]/40">/</span>

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenSignup && onOpenSignup(); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#04211F] bg-white border border-[#c2d3d2] shadow-sm hover:border-[#09A3A3] hover:text-[#09A3A3] transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (onStartCareerTest) onStartCareerTest();
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold bg-[#09A3A3] text-white shadow-sm"
            >
              Start Career Test
            </button>

            {/* Mobile Home Button */}
            <button
              type="button"
              onClick={(e) => {
                setMenuOpen(false);
                handleGoHome(e);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-[#0B3D3D]/85 hover:bg-[#09A3A3]/10 hover:text-[#09A3A3]"
            >
              Home
            </button>

            <a
              href="#about"
              onClick={(e) => { 
                setMenuOpen(false); 
                handleScrollToSection(e, 'about'); 
              }}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#0B3D3D]/85 hover:bg-[#09A3A3]/10 hover:text-[#09A3A3]"
            >
              About
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => { 
                setMenuOpen(false); 
                handleScrollToSection(e, 'how-it-works'); 
              }}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#0B3D3D]/85 hover:bg-[#09A3A3]/10 hover:text-[#09A3A3]"
            >
              How it works
            </a>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (onOpenCounselor) onOpenCounselor();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold bg-[#CFEDED]/40 text-[#078686] hover:bg-[#09A3A3] hover:text-white"
            >
              <span>AI Counselor</span>
            </button>

            <a
              href="#contact"
              onClick={(e) => { 
                setMenuOpen(false); 
                handleScrollToSection(e, 'contact'); 
              }}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#0B3D3D]/85 hover:bg-[#09A3A3]/10 hover:text-[#09A3A3]"
            >
              Contact
            </a>

            {/* Mobile Administrative console based on verified role */}
            {isLoggedIn && (
              isSuperAdmin(user) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenAdmin) onOpenAdmin();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#04302E] hover:bg-[#04302E]/10 mt-1 cursor-pointer"
                  >
                    <span>Super Admin Console</span>
                    <ShieldCheck className="w-4 h-4 text-[#04302E]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenDeveloper) onOpenDeveloper();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#09A3A3] hover:bg-[#09A3A3]/10 mt-1 cursor-pointer"
                  >
                    <span>Developer Dashboard</span>
                    <LayoutDashboard className="w-4 h-4 text-[#09A3A3]" />
                  </button>
                </>
              ) : isDeveloper(user) ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenDeveloper) onOpenDeveloper();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#09A3A3] hover:bg-[#09A3A3]/10 mt-1 cursor-pointer"
                >
                  <span>Developer Dashboard</span>
                  <LayoutDashboard className="w-4 h-4 text-[#09A3A3]" />
                </button>
              ) : null
            )}

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#e0574a] hover:bg-red-50 mt-1 cursor-pointer"
              >
                <span>Log out</span>
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}