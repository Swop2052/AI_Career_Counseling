import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, ShieldCheck, Zap, 
  ArrowLeft, Trophy, Brain, Rocket, TrendingUp, Award,
  X, Tag, CreditCard, Lock
} from 'lucide-react';

import Graphic1 from '../assets/graphics/graphic-1.png';
import Navbar from './navbar/Navbar';
import Footer from '../Footer';

const STATS_PILLS = [
  {
    title: 'Aptitude Match',
    value: '96%',
    change: '+18% High Potential',
    bg: 'bg-[#EBF9F7]',
    border: 'border-[#09A3A3]/20',
    iconBg: 'bg-gradient-to-b from-[#09A3A3] to-[#04302E]',
    icon: Trophy,
    iconColor: 'text-[#CFEDED]'
  },
  {
    title: 'Top Personality',
    value: 'ECR',
    change: 'The Dynamic Leader',
    bg: 'bg-[#FFF6E9]',
    border: 'border-[#E8B04B]/30',
    iconBg: 'bg-gradient-to-b from-[#E8B04B] to-[#d48818]',
    icon: Brain,
    iconColor: 'text-white'
  },
  {
    title: 'Career Paths',
    value: '6',
    change: 'Tailored for You',
    bg: 'bg-[#F2EFFE]',
    border: 'border-[#7C5CFC]/20',
    iconBg: 'bg-gradient-to-b from-[#7C5CFC] to-[#5531dc]',
    icon: Rocket,
    iconColor: 'text-white'
  }
];

function GraphicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-10 left-10 w-80 h-80 bg-[#09A3A3]/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#E8B04B]/15 rounded-full blur-[110px]" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-[#7C5CFC]/10 rounded-full blur-[90px]" />
    </div>
  );
}

function StaticWaveChart() {
  return (
    <div className="relative w-full h-[140px] flex items-end pt-2">
      <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="pricingWaveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#09A3A3" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#09A3A3" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[30, 70, 110, 150].map((y) => (
          <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
        ))}
        <path
          d="M 0 130 C 70 120, 110 50, 180 60 C 250 70, 310 20, 380 35 C 430 45, 470 15, 500 25 L 500 160 L 0 160 Z"
          fill="url(#pricingWaveGradient)"
        />
        <path
          d="M 0 130 C 70 120, 110 50, 180 60 C 250 70, 310 20, 380 35 C 430 45, 470 15, 500 25"
          fill="none"
          stroke="#09A3A3"
          strokeWidth="3.2"
        />
      </svg>
    </div>
  );
}

export default function PricingPage({ 
  onPurchaseSuccess, 
  onBack, 
  user = null,
  isLoggedIn = false,
  onOpenProfile,
  onOpenCounselor,
  onHomeClick,
  onOpenLogin,
  onOpenSignup,
  onStartCareerTest,
  onLogout,
  reportData
}) {
  const [selectedPlan, setSelectedPlan] = useState('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const fullName = user?.name || 'Student Navigator';

  // Checkout Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Determine dynamic careers for preview
  const previewCareers = reportData?.top_careers ? reportData.top_careers.slice(0, 3).map((c, idx) => {
    let streamInfo = 'Any Stream';
    if (c.data?.educational_pathway && c.data.educational_pathway.length > 0) {
        streamInfo = c.data.educational_pathway[0]?.stream || c.data.educational_pathway[0]?.degree || 'Any Stream';
    }
    const icons = [Rocket, TrendingUp, Award];
    const bgs = ['bg-[#F4FBFA]', 'bg-[#FDFBF5]', 'bg-[#F2EFFE]'];
    const badgeBgs = ['bg-[#09A3A3]/15 text-[#078686]', 'bg-[#E8B04B]/15 text-[#C4902F]', 'bg-[#7C5CFC]/15 text-[#6245d6]'];
    const iconBgs = ['bg-gradient-to-b from-[#09A3A3] to-[#04302E]', 'bg-gradient-to-b from-[#E8B04B] to-[#b38118]', 'bg-gradient-to-b from-[#7C5CFC] to-[#5531dc]'];

    return {
      rank: idx + 1,
      title: c.name,
      category: c.data?.category || 'Career Path',
      stream: streamInfo,
      match: Math.round(c.match_score),
      icon: icons[idx % 3],
      bg: bgs[idx % 3],
      badgeBg: badgeBgs[idx % 3],
      iconBg: iconBgs[idx % 3]
    };
  }) : [];

  const handleNavigateHome = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCheckout = (planId) => {
    setSelectedPlan(planId);
    setDiscountCode('');
    setAppliedDiscount(0);
    setCouponError('');
    setIsCheckoutOpen(true);
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = discountCode.trim().toUpperCase();
    if (code === 'TEST20' || code === 'SCHOOL20') {
      setAppliedDiscount(20);
    } else if (code === '') {
      setCouponError('Please enter a coupon code.');
    } else {
      setCouponError('Invalid code. Try TEST20 or SCHOOL20.');
      setAppliedDiscount(0);
    }
  };

  const originalPrice = selectedPlan === 'single' ? 19.00 : 599.00;
  const finalPrice = appliedDiscount > 0 
    ? (originalPrice - (originalPrice * appliedDiscount) / 100).toFixed(2)
    : originalPrice.toFixed(2);

  const handleFinalPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    }, 1100);
  };

  return (
    <div className="min-h-screen w-full bg-[#CFEDED] flex flex-col justify-between selection:bg-[#09A3A3] selection:text-white relative">
      
      <Navbar 
        isLoggedIn={isLoggedIn}
        user={user}
        onOpenProfile={onOpenProfile}
        onOpenCounselor={onOpenCounselor}
        onHomeClick={handleNavigateHome}
        onOpenLogin={onOpenLogin}
        onOpenSignup={onOpenSignup}
        onStartCareerTest={onStartCareerTest}
        onLogout={onLogout}
      />

      <div className="flex-1 w-full pt-20 sm:pt-24 pb-8 px-3 sm:px-6 md:px-10 flex items-center justify-center relative overflow-hidden">
        <GraphicBackground />

        <div className="max-w-6xl w-full bg-[#FAFDFC] rounded-[28px] sm:rounded-[36px] shadow-[0_20px_60px_rgba(4,48,46,0.08),inset_0_1px_1px_rgba(255,255,255,1)] border border-white p-4 sm:p-6 md:p-8 relative min-h-[580px] sm:min-h-[620px] max-h-[86vh] overflow-hidden mt-2.5 sm:mt-3.5">
          
          <div className="space-y-4 filter blur-[4px] select-none pointer-events-none opacity-75">
            
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#04211F]">Report Dashboard</h2>
                <p className="text-[11px] text-[#0B3D3D]/60 mt-0.5">Personalized assessment overview for {fullName}.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3.5 py-0.5 rounded-xl bg-white border border-[#04302E]/10 text-xs font-bold text-[#04211F]">Class 10</span>
                <span className="px-3.5 py-0.5 rounded-xl bg-[#09A3A3]/15 text-[#078686] text-xs font-extrabold">Verified Report</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#FFF5EC] to-[#FFE8D6] p-4 border border-[#E8B04B]/20 relative overflow-hidden">
                <img src={Graphic1} alt="AI" className="absolute right-[-10px] bottom-[-10px] w-24 opacity-90" />
                <div className="relative z-10">
                  <span className="text-[9px] font-black uppercase text-[#b5730b] bg-white/80 px-2.5 py-0.5 rounded-full">Aptitude Analyzed</span>
                  <h3 className="text-lg font-black text-[#04211F] mt-1.5 mb-0.5">Hello, Student!</h3>
                  <p className="text-[11px] text-[#0B3D3D]/75">Strengths: Problem Solving & Leadership</p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-3 gap-2.5">
                {STATS_PILLS.map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <div key={i} className={`rounded-2xl ${stat.bg} ${stat.border} border p-3.5 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-[#0B3D3D]/70">{stat.title}</span>
                        <div className={`w-6 h-6 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                          <StatIcon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-[#04211F]">{stat.value}</h4>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-7 rounded-2xl bg-white border border-[#04302E]/10 p-3.5 flex flex-col justify-between">
                <span className="text-xs font-extrabold text-[#04211F]">Growth & Aptitude Trajectory</span>
                <StaticWaveChart />
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-white border border-[#04302E]/10 p-3.5 space-y-2">
                <span className="text-xs font-extrabold text-[#04211F]">Top Career Matches</span>
                {previewCareers.map((career) => (
                  <div key={career.rank} className={`p-2 rounded-xl ${career.bg} flex items-center justify-between`}>
                    <span className="text-xs font-bold text-[#04211F] truncate">{career.title}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${career.badgeBg}`}>{career.match}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="absolute inset-0 z-30 flex flex-col justify-center items-center p-3 sm:p-5 bg-[#04211F]/25 backdrop-blur-[5px] rounded-[28px] sm:rounded-[36px] overflow-hidden">
            
            <motion.div 
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="w-full max-w-2xl flex flex-col items-center my-auto"
            >
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <button
                  type="button"
                  onClick={onBack || handleNavigateHome}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#04211F] bg-white/90 hover:bg-white px-3.5 py-1.5 rounded-xl border border-white/60 shadow-sm transition-all cursor-pointer hover:text-[#09A3A3]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <span className="px-3.5 py-1 rounded-full bg-white/90 border border-white/80 text-[10px] font-black uppercase tracking-wider text-[#04211F] shadow-sm">
                  Unlock Roadmap
                </span>
              </div>

              <div className="text-center mx-auto mb-4">
                <div className="inline-block bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/90 shadow-[0_4px_16px_rgba(4,48,46,0.08)]">
                  <h2 className="text-lg sm:text-xl font-black text-[#04211F] tracking-tight leading-none">
                    Choose Your <span className="text-[#09A3A3]">Roadmap Plan</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full mb-4">
                
                <div 
                  onClick={() => setSelectedPlan('single')}
                  className={`rounded-[28px] p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between cursor-pointer border backdrop-blur-md ${
                    selectedPlan === 'single'
                      ? 'border-[#09A3A3] bg-white shadow-[0_16px_36px_rgba(4,48,46,0.18)] -translate-y-1'
                      : 'border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(4,48,46,0.08)] hover:border-[#09A3A3]/50'
                  }`}
                >
                  <div>
                    <span className="text-xs font-extrabold text-[#0B3D3D]/60 uppercase tracking-wider block mb-1 text-left">
                      Single Test
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#04211F] mb-1.5 text-left">
                      Single Assessment
                    </h3>

                    <div className="flex items-baseline gap-1.5 pb-3 mb-4 border-b border-[#04302E]/10">
                      <span className="text-3xl font-black text-[#04211F]">₹19.00</span>
                      <span className="text-xs font-semibold text-gray-500">/ 1 credit</span>
                    </div>

                    <ul className="space-y-2 text-left mb-6">
                      {[
                        '1 Assessment Credit',
                        'Full Career Roadmap',
                        'Never Expires',
                        'AI Counselor Guidance',
                      ].map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs sm:text-[13px] text-gray-700 font-semibold">
                          <Check className="w-4 h-4 text-[#10b981] shrink-0 stroke-[3]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCheckout('single');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#04302E] hover:bg-[#075f5c] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Buy 1 Credit (₹19.00)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative rounded-[28px] p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between cursor-pointer border backdrop-blur-md ${
                    selectedPlan === 'monthly'
                      ? 'border-[#09A3A3] bg-white shadow-[0_16px_36px_rgba(4,48,46,0.18)] -translate-y-1'
                      : 'border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(4,48,46,0.08)] hover:border-[#09A3A3]/50'
                  }`}
                >
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 rounded-full bg-[#10b981] text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-xs">
                      RECOMMENDED
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-[#0B3D3D]/60 uppercase tracking-wider block mb-1 text-left">
                      Full Access
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#04211F] mb-1.5 text-left">
                      1 Month Access
                    </h3>

                    <div className="flex items-baseline gap-1.5 pb-3 mb-4 border-b border-[#04302E]/10">
                      <span className="text-3xl font-black text-[#04211F]">₹599.00</span>
                      <span className="text-xs font-semibold text-gray-500">/ 30 credits</span>
                    </div>

                    <ul className="space-y-2 text-left mb-6">
                      {[
                        '30 Assessment Credits',
                        'Full Permanent Roadmap',
                        'Never Expires',
                        'Priority AI Counselor Access',
                      ].map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs sm:text-[13px] text-gray-700 font-semibold">
                          <Check className="w-4 h-4 text-[#10b981] shrink-0 stroke-[3]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCheckout('monthly');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Buy 30 Credits (₹599.00)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              <div className="inline-flex items-center justify-center gap-4 text-xs font-bold text-[#04211F] bg-white/85 backdrop-blur-md px-6 py-2 rounded-full border border-white/90 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#09A3A3]" />
                  <span>100% Secure Checkout</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#E8B04B]" />
                  <span>Instant Report Unlock</span>
                </div>
              </div>

            </motion.div>

          </div>

        </div>

      </div>

      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
            
            <div 
              className="absolute inset-0" 
              onClick={() => !isProcessing && setIsCheckoutOpen(false)} 
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="relative w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(4,48,46,0.3),inset_0_1px_2px_rgba(255,255,255,1)] border border-[#09A3A3]/20 overflow-hidden flex flex-col z-10"
            >
              
              {/* Header Bar with Sub-heading */}
              <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#09A3A3] flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-0.5 bg-[#09A3A3] rounded-full" />
                    ORDER CONFIRMATION
                  </span>
                  <h3 className="text-xl font-black text-[#04211F] tracking-tight">
                    Complete Your Purchase
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-[#04211F] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {/* Item Details Box */}
                <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#09A3A3]/15 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#04211F]">
                      {selectedPlan === 'single' ? 'Single Assessment' : '1 Month Full Access'}
                    </h4>
                    <p className="text-[11px] font-medium text-[#0B3D3D]/65 mt-0.5">
                      {selectedPlan === 'single' ? '1 Assessment Credit • Permanent Unlock' : '30 Credits • Priority AI Counselor'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-white border border-[#09A3A3]/20 text-xs font-black text-[#078686] shadow-2xs">
                    {selectedPlan === 'single' ? '1 Credit' : '30 Credits'}
                  </span>
                </div>

                {/* Coupon Code Section */}
                <div>
                  <label className="block text-[11px] font-extrabold text-[#0B3D3D]/70 uppercase tracking-wider mb-1.5">
                    Referral / Discount Code (Optional)
                  </label>
                  
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="E.G. TEST20 OR SCHOOL20"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#F8FCFB] border border-[#09A3A3]/25 text-xs font-bold text-[#04211F] placeholder:text-gray-400 outline-none uppercase focus:ring-2 focus:ring-[#09A3A3]/30"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-extrabold text-[#04211F] shadow-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>

                  {appliedDiscount > 0 && (
                    <span className="text-[11px] font-bold text-[#10b981] flex items-center gap-1 mt-1.5">
                      <Tag className="w-3 h-3" />
                      {appliedDiscount}% discount applied successfully!
                    </span>
                  )}

                  {couponError && (
                    <span className="text-[11px] font-bold text-rose-500 block mt-1.5">
                      {couponError}
                    </span>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Original Price</span>
                    <span>₹{originalPrice.toFixed(2)}</span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-[#10b981]">
                      <span>Discount ({appliedDiscount}%)</span>
                      <span>- ₹{((originalPrice * appliedDiscount) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-base font-black text-[#04211F] pt-1 border-t border-dashed border-gray-200">
                    <span>Final Price</span>
                    <span className="text-xl font-black text-[#09A3A3]">
                      ₹{finalPrice}
                    </span>
                  </div>
                </div>

                {/* Terms Disclaimer */}
                <p className="text-[10px] text-gray-400 font-medium text-center leading-relaxed">
                  By proceeding, you agree to our{' '}
                  <span className="text-[#09A3A3] underline font-bold cursor-pointer">
                    Payment, No-Refund & Credit Policy (PDF)
                  </span>.
                </p>

                {/* Modal Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-1/3 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleFinalPayment}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white text-xs font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay ₹{finalPrice} →</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Global Footer */}
      <Footer onStartTest={onStartCareerTest} />

    </div>
  );
}