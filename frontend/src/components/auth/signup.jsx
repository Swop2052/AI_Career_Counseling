import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Lock, Eye, EyeOff, Compass, ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function SignupPage({ onSignup, onSuccess, onSwitchToLogin, onHome, onOpenTerms, onOpenPrivacy, onOpenConsent }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordChecks = {
    length: formData.password.length >= 8,
    hasNumber: /\d/.test(formData.password),
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields to create your account.');
      return;
    }
    if (!passwordChecks.length) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please accept the Terms, Privacy Policy & Consent Form to continue.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const initials = formData.fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

      const createdUserData = {
        name: formData.fullName,
        email: formData.email,
        initials: initials,
      };

      if (onSuccess) {
        onSuccess(createdUserData);
      } else if (onSignup) {
        onSignup(createdUserData);
      }
    }, 850);
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-x-hidden flex flex-col justify-between selection:bg-[#09A3A3] selection:text-white">
      
      {/* TOP 50% WAVY SECTION */}
      <div className="relative w-full bg-[#ABE0E0] z-0 px-6 sm:px-12 pt-1 sm:pt-1 pb-24 sm:pb-31 flex flex-col">
        
        {/* Top Header Bar */}
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 pt-1">
          
          <div 
            onClick={onHome}
            className="group flex items-center gap-0.5 cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-95 py-2"
            title="Go to Home"
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

        </div>

        {/* Top Heading on Wave */}
        <div className="max-w-2xl mx-auto text-center z-10 sm:mt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-[#09A3A3]/20 text-[9px] font-black text-[#04211F] uppercase tracking-wider mb-2 shadow-sm">
            Your strengths deserve a real map
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-black text-[#04211F] tracking-tight leading-tight mb-1.3">
            Create your account
          </h1>
          
          <p className="text-xs sm:text-[13px] text-[#0B3D3D]/75 font-medium max-w-md mx-auto">
            Join thousands of students discovering their personalized career roadmap.
          </p>
        </div>

        {/* WAVY SVG DIVIDER AT THE BOTTOM */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 text-white pointer-events-none">
          <svg
            className="relative block w-full h-[50px] sm:h-[70px] md:h-[90px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C150,85 400,115 600,60 C800,5 1050,45 1200,80 L1200,120 L0,120 Z" />
          </svg>
        </div>

      </div>

      {/* SIGNUP CARD */}
      <div className="flex-1 w-full flex items-center justify-center px-4 mt-15 sm:-mt-29 z-20 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-xl bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 md:p-9 shadow-[0_28px_70px_rgba(4,48,46,0.14),0_10px_25px_rgba(4,48,46,0.06),inset_0_1px_2px_rgba(255,255,255,1)] border border-[#04302E]/10"
        >

          {error && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            
            {/* Full Name Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                />
              </div>
            </div>

            {/* Create Password Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#09A3A3] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#09A3A3] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox (Separated Terms & Privacy Links) */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded-md border-[#09A3A3]/40 text-[#09A3A3] focus:ring-[#09A3A3]/30 cursor-pointer accent-[#09A3A3]"
                />
                <span className="text-[11px] sm:text-xs font-semibold text-[#0B3D3D]/70">
                  I agree to the{' '}
                  <button 
                    type="button" 
                    onClick={onOpenTerms} 
                    className="text-[#04302E] font-bold underline cursor-pointer hover:text-[#09A3A3]"
                  >
                    Terms
                  </button>,{' '}
                  <button 
                    type="button" 
                    onClick={onOpenPrivacy} 
                    className="text-[#04302E] font-bold underline cursor-pointer hover:text-[#09A3A3]"
                  >
                    Privacy
                  </button> &{' '}
                  <button 
                    type="button" 
                    onClick={onOpenConsent} 
                    className="text-[#04302E] font-bold underline cursor-pointer hover:text-[#09A3A3]"
                  >
                    Consent Form
                  </button>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 overflow-hidden"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">Start My Assessment</span>
                    <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Switch to Login */}
          <div className="mt-3 pt-2 border-t border-gray-100 text-center">
            <p className="text-xs font-medium text-[#0B3D3D]/70">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-extrabold text-[#09A3A3] hover:text-[#04302E] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Log in
              </button>
            </p>
          </div>

        </motion.div>
      </div>

      {/* Footer Trust Note */}
      <div className="w-full text-center pb-2 text-[11px] font-bold text-[#0B3D3D]/50 flex items-center justify-center gap-1 z-20 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-[#09A3A3]" />
        <span>100% Student Data Privacy Guaranteed</span>
      </div>

    </div>
  );
}