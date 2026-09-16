import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/authApi';

export default function AcceptInvitation({ onLoginSuccess, onGoToLogin }) {
  const [token, setToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  useEffect(() => {
    // Extract token from hash query parameters e.g. #accept-invite?token=xyz
    const hash = window.location.hash || '';
    const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryPart);
    const tok = params.get('token');
    if (tok) {
      setToken(tok.trim());
    } else {
      setError('No invitation token was detected in the URL. Please ensure you clicked the full link from your invitation email.');
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invitation token is missing. Please click the full invitation link sent to your email.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    authApi.setupAccount(token, password, fullName.trim())
      .then((res) => {
        setLoading(false);
        const user = res.user;
        setCreatedUser(user);
        setSuccess(true);
        if (user) {
          localStorage.setItem('skillsense_user', JSON.stringify(user));
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'This invitation is invalid, has expired, or was already used. Please contact your Super Admin for a new invite.');
      });
  };

  const handleProceed = () => {
    if (createdUser && onLoginSuccess) {
      onLoginSuccess(createdUser);
    } else if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.location.hash = '#login';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E7F7F7]/40 flex flex-col justify-between selection:bg-[#09A3A3] selection:text-white">
      {/* Top Header */}
      <div className="w-full bg-[#ABE0E0]/60 border-b border-[#09A3A3]/20 py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <img
            src="/logo.png"
            alt="SkillSense"
            className="h-9 w-auto mix-blend-multiply"
          />
          <span className="font-extrabold text-lg text-[#04211F] tracking-tight">
            SkillSense<span className="text-[#09A3A3]">.</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onGoToLogin}
          className="text-xs font-bold text-[#04211F] hover:text-[#09A3A3] transition-colors cursor-pointer"
        >
          Back to Login
        </button>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-7 sm:p-9 shadow-xl border border-[#04302E]/10 relative overflow-hidden"
        >
          {!success ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-black uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                Account Activation
              </div>

              <h1 className="text-2xl font-black text-[#04211F] tracking-tight mb-2">
                Set Up Your Account
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                Welcome to SkillSense! Please create a secure password to complete your administrator invitation and gain access.
              </p>

              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#04211F] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#09A3A3]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F0F7F6] border border-[#09A3A3]/20 text-xs sm:text-sm font-semibold text-[#04211F] outline-none focus:bg-white focus:ring-2 focus:ring-[#09A3A3]/30 focus:border-[#09A3A3] transition-all"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Activating account...
                      </span>
                    ) : (
                      <>
                        <span>Complete Setup & Access Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-2 border border-emerald-200">
                Setup Complete
              </div>

              <h2 className="text-2xl font-black text-[#04211F] tracking-tight mb-2">
                Account Activated!
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                Your credentials have been securely registered as <span className="font-bold text-[#04211F]">{createdUser?.role}</span>. You can now access your administration console.
              </p>

              <button
                type="button"
                onClick={handleProceed}
                className="w-full py-3.5 rounded-2xl bg-[#04302E] hover:bg-[#075653] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#04302E]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Administration Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-gray-400 font-medium border-t border-gray-100 bg-white">
        SkillSense Career Counseling Platform • Secure Invitation Service
      </div>
    </div>
  );
}
