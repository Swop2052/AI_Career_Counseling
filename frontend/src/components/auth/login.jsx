import { authApi } from '../../api/authApi';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Compass, ArrowRight,
  ShieldCheck, X, CheckCircle2, KeyRound,
  Inbox, RefreshCw
} from 'lucide-react';

export default function LoginPage({ onSuccess, onLogin, onSwitchToSignup, onHome }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both your email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    let pendingAttemptId = null;
    try {
      const rawFlow = sessionStorage.getItem('skillsense_active_assessment_flow');
      if (rawFlow) {
        const parsed = JSON.parse(rawFlow);
        if (parsed && parsed.attemptId && !parsed.dismissed) {
          pendingAttemptId = parsed.attemptId;
        }
      }
    } catch {
      pendingAttemptId = null;
    }
    if (!pendingAttemptId) {
      pendingAttemptId = localStorage.getItem('skillsense_return_to_unlock') ||
                         localStorage.getItem('skillsense_pending_attempt_id') ||
                         localStorage.getItem('skillsense_saved_attempt_id') ||
                         null;
    }

    authApi.login(formData.email, formData.password, pendingAttemptId)
      .then((res) => {
        setIsSubmitting(false);
        const user = res.user || {
          name: formData.email.split('@')[0],
          email: formData.email,
          initials: formData.email.slice(0, 2).toUpperCase()
        };
        const claimedId = res.claimed_attempt_id || pendingAttemptId || null;
        if (claimedId) {
          try {
            const rawFlow = sessionStorage.getItem('skillsense_active_assessment_flow');
            const flow = rawFlow ? JSON.parse(rawFlow) : {};
            sessionStorage.setItem('skillsense_active_assessment_flow', JSON.stringify({
              ...flow,
              attemptId: claimedId,
              flowState: 'claimed_locked',
              completedAt: flow.completedAt || Date.now(),
              dismissed: false
            }));
            localStorage.setItem('skillsense_return_to_unlock', claimedId);
            localStorage.setItem('skillsense_pending_attempt_id', claimedId);
          } catch (e) {
            console.warn('Failed to update active assessment flow:', e);
          }
        }
        if (onSuccess) onSuccess(user, claimedId);
        if (onLogin) onLogin(user, claimedId);
      })
      .catch((err) => {
        setIsSubmitting(false);
        setError(err.message || 'Invalid email or password. Please try again.');
      });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotNotice('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }

    setIsForgotLoading(true);
    authApi.forgotPassword(forgotEmail.trim().toLowerCase())
      .then((res) => {
        setIsForgotLoading(false);
        setForgotNotice(res.message || 'If this email is registered, a verification code has been sent.');
        setForgotStep('OTP');
      })
      .catch((err) => {
        setIsForgotLoading(false);
        setForgotError(err.message || 'Failed to send verification code. Please try again.');
      });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotNotice('');

    const cleanOtp = otpCode.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setForgotError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsForgotLoading(true);
    authApi.verifyOtp(forgotEmail.trim().toLowerCase(), cleanOtp)
      .then((res) => {
        setIsForgotLoading(false);
        setResetToken(res.reset_token || cleanOtp);
        setForgotNotice('');
        setForgotStep('PASSWORD');
      })
      .catch((err) => {
        setIsForgotLoading(false);
        setForgotError(err.message || 'Incorrect or expired verification code.');
      });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsForgotLoading(true);
    authApi.resetPassword(forgotEmail.trim().toLowerCase(), resetToken, newPassword)
      .then((res) => {
        setIsForgotLoading(false);
        setForgotStep('SUCCESS');
      })
      .catch((err) => {
        setIsForgotLoading(false);
        setForgotError(err.message || 'Failed to update password. Please try again.');
      });
  };

  const handleResendOtp = () => {
    setForgotError('');
    setIsForgotLoading(true);
    authApi.forgotPassword(forgotEmail.trim().toLowerCase())
      .then((res) => {
        setIsForgotLoading(false);
        setForgotNotice('A fresh verification code has been sent to your email.');
      })
      .catch((err) => {
        setIsForgotLoading(false);
        setForgotError(err.message || 'Failed to resend verification code.');
      });
  };

  const closeForgotModal = () => {
    setIsForgotOpen(false);
    setForgotStep('EMAIL');
    setForgotEmail('');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotNotice('');
    setIsForgotLoading(false);
  };

  return (
    <div className="h-screen w-full bg-white relative overflow-hidden flex flex-col justify-between selection:bg-[#09A3A3] selection:text-white">
      
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#ABE0E0] z-0 px-6 sm:px-12 pt-4 sm:pt-6 flex flex-col">
        
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

        <div className="max-w-2xl mx-auto text-center z-10 mt-1 sm:mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-[#09A3A3]/20 text-[9px] font-black text-[#04211F] uppercase tracking-wider mb-1.5 shadow-sm">
            Find the path that actually fits you
          </div>
          
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#04211F] tracking-tight leading-tight">
            Welcome back
          </h1>
          
          <p className="text-xs sm:text-[13px] text-[#0B3D3D]/75 font-medium max-w-md mx-auto mt-0.5">
            Log in to continue your career assessment and view saved progress.
          </p>
        </div>

        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-10 text-white pointer-events-none">
          <svg
            className="relative block w-full h-[60px] sm:h-[80px] md:h-[100px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C150,85 400,115 600,60 C800,5 1050,45 1200,80 L1200,120 L0,120 Z" />
          </svg>
        </div>

      </div>

      <div className="h-32 sm:h-36 shrink-0 z-0" />

      <div className="flex-1 w-full flex items-center justify-center px-4 z-20">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-xl bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-11 md:p-12 shadow-[0_28px_70px_rgba(4,48,46,0.14),0_10px_25px_rgba(4,48,46,0.06),inset_0_1px_2px_rgba(255,255,255,1)] border border-[#04302E]/10"
        >

          {error && (
            <div className="mb-5 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            <div>
              <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] font-bold text-[#09A3A3] hover:text-[#04302E] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#09A3A3] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-[#09A3A3]/40 text-[#09A3A3] focus:ring-[#09A3A3]/30 cursor-pointer accent-[#09A3A3]"
                />
                <span className="text-xs font-semibold text-[#0B3D3D]/70">Remember this device</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 overflow-hidden"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">Log in to SkillSense</span>
                    <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                  </>
                )}
              </button>
            </div>

          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs font-medium text-[#0B3D3D]/70">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="font-extrabold text-[#09A3A3] hover:text-[#04302E] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Create free account
              </button>
            </p>
          </div>

        </motion.div>
      </div>

      <div className="w-full text-center pb-3 text-[11px] font-bold text-[#0B3D3D]/50 flex items-center justify-center gap-1 z-20 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-[#09A3A3]" />
        <span>100% Student Data Privacy Guaranteed</span>
      </div>

      <AnimatePresence>
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-[36px] p-7 sm:p-9 shadow-[0_30px_90px_rgba(4,48,46,0.22),inset_0_1px_2px_rgba(255,255,255,1)] border border-[#04302E]/10 relative overflow-hidden text-[#04211F]"
            >
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#ABE0E0]/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#09A3A3]/10 rounded-full blur-2xl pointer-events-none" />

              <button
                type="button"
                onClick={closeForgotModal}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F0F7F6] border border-[#09A3A3]/15 flex items-center justify-center text-[#0B3D3D]/60 hover:text-[#04211F] hover:bg-[#CFEDED]/40 transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {forgotStep === 'EMAIL' && (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04302E] to-[#09A3A3] p-1 shadow-lg shadow-[#09A3A3]/20 mb-5 relative inline-block">
                    <div className="w-full h-full rounded-[13px] bg-[#021c1b] flex items-center justify-center border border-white/20">
                      <KeyRound className="w-6 h-6 text-[#32d4d4]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-[#04211F] tracking-tight mb-1.5">
                    Forgot password?
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#0B3D3D]/70 mb-6 leading-relaxed font-medium">
                    Enter your registered email address and we will email you a 6-digit verification code to confirm your identity.
                  </p>

                  {forgotError && (
                    <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-2">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2.5">
                      <button
                        type="submit"
                        disabled={isForgotLoading}
                        className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 overflow-hidden"
                      >
                        {isForgotLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending code...
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">Send Verification Code</span>
                            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={closeForgotModal}
                        className="w-full py-2.5 rounded-2xl text-xs font-bold text-[#0B3D3D]/70 hover:text-[#04302E] transition-colors cursor-pointer"
                      >
                        Cancel and return to login
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {forgotStep === 'OTP' && (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04302E] to-[#09A3A3] p-1 shadow-lg shadow-[#09A3A3]/20 mb-5 relative inline-block">
                    <div className="w-full h-full rounded-[13px] bg-[#021c1b] flex items-center justify-center border border-white/20">
                      <Mail className="w-6 h-6 text-[#32d4d4]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-[#04211F] tracking-tight mb-1.5">
                    Check your email
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#0B3D3D]/70 mb-5 leading-relaxed font-medium">
                    We sent a 6-digit verification code to <span className="font-bold text-[#04211F]">{forgotEmail}</span>. Enter it below to proceed:
                  </p>

                  {forgotNotice && (
                    <div className="mb-4 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{forgotNotice}</span>
                    </div>
                  )}

                  {forgotError && (
                    <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-2">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/30 text-2xl font-black font-mono tracking-[10px] text-[#04211F] placeholder:text-gray-300 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/40 focus:border-[#09A3A3] transition-all"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-[#0B3D3D]/50 text-center mt-2 font-medium">
                        Verification codes expire in 10 minutes.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2.5">
                      <button
                        type="submit"
                        disabled={isForgotLoading || otpCode.replace(/\D/g, '').length !== 6}
                        className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 overflow-hidden"
                      >
                        {isForgotLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">Verify Code</span>
                            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isForgotLoading}
                          className="text-xs font-bold text-[#09A3A3] hover:text-[#04302E] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Resend Code
                        </button>
                        <button
                          type="button"
                          onClick={() => { setForgotStep('EMAIL'); setForgotError(''); setForgotNotice(''); }}
                          className="text-xs font-semibold text-gray-500 hover:text-[#04302E] transition-colors cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {forgotStep === 'PASSWORD' && (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04302E] to-[#09A3A3] p-1 shadow-lg shadow-[#09A3A3]/20 mb-5 relative inline-block">
                    <div className="w-full h-full rounded-[13px] bg-[#021c1b] flex items-center justify-center border border-white/20">
                      <Lock className="w-6 h-6 text-[#32d4d4]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-[#04211F] tracking-tight mb-1.5">
                    Set new password
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#0B3D3D]/70 mb-5 leading-relaxed font-medium">
                    Identity verified! Choose a secure new password for <span className="font-bold text-[#04211F]">{forgotEmail}</span>.
                  </p>

                  {forgotError && (
                    <div className="mb-4 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B3D3D]/50 hover:text-[#04211F] cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isForgotLoading}
                        className="group relative w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 overflow-hidden"
                      >
                        {isForgotLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating password...
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">Reset & Update Password</span>
                            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {forgotStep === 'SUCCESS' && (
                <div className="text-center py-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-2 border border-emerald-200">
                    Password Reset Complete
                  </div>

                  <h3 className="text-2xl font-black text-[#04211F] tracking-tight mb-2">
                    You're all set!
                  </h3>

                  <p className="text-xs sm:text-[13px] text-[#0B3D3D]/70 leading-relaxed font-medium mb-6">
                    Your password has been successfully updated. You can now log in to SkillSense using your new credentials.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, email: forgotEmail, password: '' });
                      closeForgotModal();
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#04302E] hover:bg-[#075653] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#04302E]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}