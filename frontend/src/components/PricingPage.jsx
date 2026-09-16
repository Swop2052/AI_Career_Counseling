// frontend/src/components/PricingPage.jsx - Dynamic, Responsive, Server-Authoritative Pricing & Resilient Razorpay Checkout
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, ShieldCheck, Zap, 
  ArrowLeft, Trophy, Brain, Rocket, Award, Sparkles,
  X, Tag, CreditCard, Lock, AlertCircle, RefreshCw, LogIn, UserPlus, Gift
} from 'lucide-react';
import { paymentApi } from '../api/paymentApi';
import { authApi } from '../api/authApi';

function loadRazorpayScript(timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export default function PricingPage({ 
  user = null,
  isLoggedIn = false,
  onPurchaseSuccess, 
  onBack, 
  onRequireAuth,
  onOpenLogin,
  onOpenSignup,
  reportData
}) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  // Checkout Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Payment Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const rzpInstanceRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isCheckoutOpenRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isCheckoutOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen]);

  // Unauthenticated Prompt Modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch live active pricing plans from backend/PostgreSQL
  const fetchPlans = () => {
    setLoadingPlans(true);
    setPlansError('');
    paymentApi.getPlans()
      .then((res) => {
        if (res && Array.isArray(res.plans)) {
          const active = res.plans.filter(p => p.is_active === 1);
          setPlans(active);
          if (active.length > 0) {
            setSelectedPlanId(active[0].id);
          }
        } else {
          setPlans([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        setPlansError(err.message || 'Unable to load pricing plans from server. Please try again.');
      })
      .finally(() => setLoadingPlans(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectAndPurchase = (planId) => {
    setSelectedPlanId(planId);
    setPaymentError('');
    setCouponError('');
    setDiscountCode('');
    setAppliedCoupon(null);
    setIsProcessing(false);
    setAwaitingPayment(false);
    setActiveOrderId(null);

    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setIsCheckoutOpen(true);
  };

  // Close checkout safely without leaving stuck spinners
  const handleCloseCheckout = () => {
    if (activeOrderId) {
      paymentApi.cancelOrder(activeOrderId).catch(() => {});
    }
    if (rzpInstanceRef.current) {
      try {
        rzpInstanceRef.current.close();
      } catch (e) {}
    }
    isProcessingRef.current = false;
    setIsProcessing(false);
    setAwaitingPayment(false);
    setPaymentError('');
    setIsCheckoutOpen(false);
    setActiveOrderId(null);
  };

  const selectedPlanObj = plans.find(p => p.id === selectedPlanId) || plans[0] || null;
  const originalPrice = selectedPlanObj ? Number(selectedPlanObj.price || 0) : 0;
  
  // Authoritative server-calculated amounts
  const finalPrice = appliedCoupon 
    ? Number(appliedCoupon.final_price ?? originalPrice).toFixed(2)
    : originalPrice.toFixed(2);
    
  const discountAmount = appliedCoupon 
    ? Number(appliedCoupon.discount_amount ?? 0).toFixed(2)
    : "0.00";

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!selectedPlanObj) return;

    setCouponError('');
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await paymentApi.validateCoupon(selectedPlanObj.id, code);
      if (res && res.valid) {
        setAppliedCoupon(res);
        setCouponError('');
      } else {
        setCouponError(res?.message || res?.error || 'Invalid or expired coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Failed to validate coupon.');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountCode('');
    setCouponError('');
  };

  const handleFinalPayment = async () => {
    if (!selectedPlanObj || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setPaymentError('');
    const attemptId = reportData?.attempt_id || localStorage.getItem('skillsense_pending_attempt_id') || localStorage.getItem('skillsense_return_to_unlock') || localStorage.getItem('skillsense_saved_attempt_id');
    const cleanCoupon = appliedCoupon ? appliedCoupon.code : (discountCode.trim().toUpperCase() || null);

    let launchedGateway = false;

    try {
      // 1. 100% Discount zero-cost redemption (Never call Razorpay for free redemptions)
      if (parseFloat(finalPrice) === 0) {
        const res = await paymentApi.redeemZero(selectedPlanObj.id, cleanCoupon, attemptId);
        setIsProcessing(false);
        setAwaitingPayment(false);
        setIsCheckoutOpen(false);
        setActiveOrderId(null);
        isProcessingRef.current = false;
        
        // Re-sync authoritative user session
        authApi.getMe().catch(() => {});
        
        if (onPurchaseSuccess) onPurchaseSuccess(res);
        return;
      }

      // 2. Paid Razorpay Flow
      const loaded = await loadRazorpayScript(10000);
      if (!loaded) {
        throw new Error("Failed to load Razorpay payment gateway. Please check your internet connection.");
      }

      if (!isMountedRef.current || !isCheckoutOpenRef.current) {
        return;
      }

      // Create verified order on the server
      const orderData = await paymentApi.createOrder(
        selectedPlanObj.id,
        cleanCoupon || null,
        attemptId
      );

      if (!orderData || !orderData.order_id || !orderData.key_id) {
        throw new Error(orderData?.error || "Server failed to generate payment order.");
      }

      if (!isMountedRef.current || !isCheckoutOpenRef.current) {
        paymentApi.cancelOrder(orderData.order_id).catch(() => {});
        return;
      }

      setActiveOrderId(orderData.order_id);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SkillSense Career Assessment',
        description: `${selectedPlanObj.name} (${selectedPlanObj.credits} ${selectedPlanObj.credits === 1 ? 'Credit' : 'Credits'})`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#09A3A3'
        },
        handler: async function (response) {
          try {
            isProcessingRef.current = true;
            setIsProcessing(true);
            setAwaitingPayment(false);
            const verifyRes = await paymentApi.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              attemptId
            );
            setIsProcessing(false);
            setIsCheckoutOpen(false);
            setActiveOrderId(null);
            
            // Re-sync authoritative user session
            authApi.getMe().catch(() => {});
            
            if (onPurchaseSuccess) onPurchaseSuccess(verifyRes);
          } catch (err) {
            setIsProcessing(false);
            setAwaitingPayment(false);
            setPaymentError(err.message || "Payment verification failed. Please contact support with Payment ID: " + response.razorpay_payment_id);
          } finally {
            isProcessingRef.current = false;
          }
        },
        modal: {
          ondismiss: function () {
            // User closed Razorpay popup without paying
            isProcessingRef.current = false;
            setIsProcessing(false);
            setAwaitingPayment(false);
            if (orderData.order_id) {
              paymentApi.cancelOrder(orderData.order_id).catch(() => {});
            }
          },
          escape: true,
          backdropclose: false
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzpInstanceRef.current = rzp;

        rzp.on('payment.failed', function (resp) {
          isProcessingRef.current = false;
          setIsProcessing(false);
          setAwaitingPayment(false);
          const reason = resp.error?.description || resp.error?.reason || "Payment declined or cancelled.";
          setPaymentError(`Payment Failed: ${reason}`);
        });

        rzp.open();
        launchedGateway = true;
        
        // Set state to awaiting payment and stop the connecting spinner immediately!
        setIsProcessing(false);
        setAwaitingPayment(true);

      } catch (rzpErr) {
        throw new Error(`Unable to launch payment gateway: ${rzpErr.message || rzpErr}`);
      }

    } catch (err) {
      if (err.status === 401) {
        setIsCheckoutOpen(false);
        setShowAuthModal(true);
      } else {
        setPaymentError(err.message || "Unable to initiate payment. Please try again.");
      }
    } finally {
      if (!launchedGateway) {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-between relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#09A3A3]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#E8B04B]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl w-full mx-auto flex-grow flex flex-col items-center">
        
        {/* Top Back Navigation Bar */}
        <div className="w-full flex items-center justify-between mb-6 sm:mb-8">
          <button
            type="button"
            onClick={onBack || (() => window.history.back())}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#04211F] bg-white hover:bg-gray-50 px-4 py-2 rounded-xl border border-[#c2d3d2] shadow-[0_2px_4px_rgba(0,0,0,0.04)] transition-all cursor-pointer hover:text-[#09A3A3]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-white text-[11px] font-black uppercase tracking-wider text-[#04302E] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#09A3A3]" />
            <span>Official Roadmap Plans</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09A3A3]/15 text-[#078686] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Invest in Your Future</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#04211F] tracking-tight leading-tight mb-3">
            Choose Your <span className="text-[#09A3A3]">Roadmap Plan</span>
          </h1>
          <p className="text-sm sm:text-base text-[#0B3D3D]/70 font-medium max-w-xl mx-auto">
            Flexible, server-verified pricing for students and educators. Every credit unlocks full psychological trait analysis, deep RIASEC matching, and an AI-guided career trajectory.
          </p>
        </div>

        {/* Dynamic Plans Content */}
        {loadingPlans ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#09A3A3] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-[#04302E]">Loading pricing plans from server...</p>
          </div>
        ) : plansError ? (
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-red-200 shadow-md text-center my-8">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#04211F] mb-2">Unable to Load Plans</h3>
            <p className="text-xs text-gray-600 mb-6">{plansError}</p>
            <button
              type="button"
              onClick={fetchPlans}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#04302E] hover:bg-[#075f5c] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-md text-center my-8">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#09A3A3] flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#04211F] mb-2">No Plans Available</h3>
            <p className="text-xs text-gray-600 mb-6">
              There are currently no active pricing tiers configured in the database. Please check back shortly.
            </p>
            <button
              type="button"
              onClick={fetchPlans}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#04302E] text-white text-xs font-bold transition-all cursor-pointer hover:bg-[#075f5c]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        ) : (
          <div className="w-full mb-12">
            {/* Dynamic Grid Layout */}
            <div 
              className={`w-full mx-auto ${
                plans.length === 1 
                  ? 'max-w-sm flex justify-center'
                  : plans.length === 2 
                  ? 'max-w-2xl flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-stretch'
                  : 'max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 justify-center items-stretch'
              }`}
            >
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                const priceFormatted = Number(p.price).toFixed(2);
                const isFeatured = Boolean(p.is_recommended);

                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-[28px] p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-200 cursor-pointer ${
                      isFeatured
                        ? 'bg-white border-2 border-[#09A3A3] shadow-[0_20px_40px_rgba(9,163,163,0.18)]'
                        : isSelected
                        ? 'bg-white border-2 border-[#04302E] shadow-[0_16px_36px_rgba(4,48,46,0.14)]'
                        : 'bg-white/90 hover:bg-white border border-white/90 shadow-[0_10px_28px_rgba(4,48,46,0.06)] hover:border-[#09A3A3]/40'
                    }`}
                    onClick={() => setSelectedPlanId(p.id)}
                  >
                    {/* Featured Badge from Database */}
                    {isFeatured && (
                      <div className="absolute -top-3.5 right-6">
                        <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>POPULAR</span>
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Sub-header */}
                      <span className="text-[11px] font-extrabold text-[#0B3D3D]/60 uppercase tracking-wider block mb-1">
                        {p.credits === 1 ? 'Single Assessment' : `${p.credits} Assessments Pack`}
                      </span>

                      {/* Plan Name */}
                      <h3 className="text-xl font-black text-[#04211F] tracking-tight mb-2">
                        {p.name}
                      </h3>

                      {/* Price & Credit ratio */}
                      <div className="flex items-baseline gap-1.5 pb-4 mb-5 border-b border-[#04302E]/10">
                        <span className="text-3xl sm:text-4xl font-black text-[#04211F]">
                          ₹{priceFormatted}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          / {p.credits} {p.credits === 1 ? 'credit' : 'credits'}
                        </span>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2.5 text-left mb-6">
                        {[
                          `${p.credits} Assessment ${p.credits === 1 ? 'Credit' : 'Credits'}`,
                          'Full RIASEC Trait Analysis',
                          'Comprehensive Career Roadmap',
                          'Credits Never Expire',
                          'AI Counselor Guidance Included',
                        ].map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 font-semibold">
                            <div className="w-4 h-4 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndPurchase(p.id);
                      }}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                        isFeatured || isSelected
                          ? 'bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white hover:brightness-105 shadow-[0_6px_20px_rgba(4,48,46,0.25)]'
                          : 'bg-[#04302E] hover:bg-[#075f5c] text-white'
                      }`}
                    >
                      <span>Buy {p.credits} {p.credits === 1 ? 'Credit' : 'Credits'} (₹{priceFormatted})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold text-[#04211F] bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/90 shadow-sm mt-auto mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#09A3A3]" />
            <span>100% Secure Razorpay Checkout</span>
          </div>
          <span className="hidden sm:inline text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#E8B04B]" />
            <span>Instant Credit Delivery</span>
          </div>
          <span className="hidden sm:inline text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#10b981]" />
            <span>Permanent Wallet Storage</span>
          </div>
        </div>

      </div>

      {/* ----------------- CHECKOUT MODAL ----------------- */}
      <AnimatePresence>
        {isCheckoutOpen && selectedPlanObj && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
            
            {/* Click backdrop to cancel/close */}
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={handleCloseCheckout} 
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="relative w-full max-w-[460px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(4,48,46,0.3)] border border-[#09A3A3]/20 overflow-hidden flex flex-col z-10"
            >
              
              {/* Header Bar */}
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

                {/* Close "X" button - NEVER DISABLED */}
                <button
                  type="button"
                  onClick={handleCloseCheckout}
                  className="p-1.5 rounded-full text-gray-400 hover:text-[#04211F] hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close and cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {/* Plan Summary Card */}
                <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#09A3A3]/15 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#04211F]">
                      {selectedPlanObj.name}
                    </h4>
                    <p className="text-[11px] font-medium text-[#0B3D3D]/65 mt-0.5">
                      {selectedPlanObj.credits} Assessment {selectedPlanObj.credits === 1 ? 'Credit' : 'Credits'} • Never Expires
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-white border border-[#09A3A3]/20 text-xs font-black text-[#078686] shadow-xs">
                    {selectedPlanObj.credits} {selectedPlanObj.credits === 1 ? 'Credit' : 'Credits'}
                  </span>
                </div>

                {/* Referral / Coupon Code Input */}
                <div>
                  <label className="block text-[11px] font-extrabold text-[#0B3D3D]/70 uppercase tracking-wider mb-1.5">
                    Referral / Campaign Code (Optional)
                  </label>
                  
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value);
                          if (couponError) setCouponError('');
                        }}
                        disabled={isValidatingCoupon || isProcessing}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#F8FCFB] border border-[#09A3A3]/25 text-xs font-bold text-[#04211F] placeholder:text-gray-400 outline-none uppercase focus:ring-2 focus:ring-[#09A3A3]/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isValidatingCoupon || isProcessing || !discountCode.trim()}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-extrabold text-[#04211F] shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isValidatingCoupon ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#09A3A3] border-t-transparent rounded-full animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </form>

                  {/* Applied Coupon Badge */}
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {appliedCoupon.code}: {appliedCoupon.discount_type === 'PERCENTAGE' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_amount}`} off applied (-₹{discountAmount})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-black text-emerald-700 hover:text-rose-600 ml-2 px-1.5 py-0.5 rounded hover:bg-emerald-100/60 transition-colors cursor-pointer"
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
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
                    <span>Base Amount</span>
                    <span>₹{originalPrice.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && Number(discountAmount) > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-[#10b981]">
                      <span>Discount</span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-base font-black text-[#04211F] pt-2 border-t border-dashed border-gray-200">
                    <span>Total Payable</span>
                    <span className="text-2xl font-black text-[#09A3A3]">
                      ₹{finalPrice}
                    </span>
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Awaiting Gateway Notification */}
                {awaitingPayment && !paymentError && (
                  <div className="p-3 bg-teal-50 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                      <span>Razorpay payment window is open.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFinalPayment}
                      className="text-[11px] font-bold underline hover:text-teal-900 cursor-pointer"
                    >
                      Re-open
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Cancel button - NEVER DISABLED */}
                  <button
                    type="button"
                    onClick={handleCloseCheckout}
                    className="w-1/3 py-3.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  {/* Payment / Free Redemption button */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleFinalPayment}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white text-xs font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting Gateway...</span>
                      </span>
                    ) : awaitingPayment ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-launch Razorpay</span>
                      </span>
                    ) : parseFloat(finalPrice) === 0 ? (
                      <>
                        <Gift className="w-4 h-4 text-emerald-300" />
                        <span>Redeem Free (₹0.00)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay ₹{finalPrice} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 font-medium text-center">
                  Payments are encrypted and processed securely by Razorpay.
                </p>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- AUTH REQUIRED PROMPT MODAL ----------------- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowAuthModal(false)} />
            
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#09A3A3]/15 text-[#09A3A3] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-black text-[#04211F] mb-2">
                Sign in to Purchase
              </h3>
              
              <p className="text-xs text-gray-600 mb-6">
                Please log in or create your free SkillSense account so your purchased credits are securely deposited into your wallet.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    if (onOpenLogin) onOpenLogin();
                    else if (onRequireAuth) onRequireAuth();
                  }}
                  className="w-full py-3 rounded-xl bg-[#04302E] hover:bg-[#075f5c] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Existing Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    if (onOpenSignup) onOpenSignup();
                    else if (onRequireAuth) onRequireAuth();
                  }}
                  className="w-full py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#04211F] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create a New Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
