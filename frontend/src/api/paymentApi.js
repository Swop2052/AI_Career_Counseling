// frontend/src/api/paymentApi.js - Dynamic pricing, discount coupons, Razorpay checkout & zero-cost redemption
import { request } from './client';

export const paymentApi = {
  getPlans: () => {
    return request('/api/plans', {
      method: 'GET'
    });
  },

  getLowestPlan: () => {
    return request('/api/pricing/lowest-plan', {
      method: 'GET'
    });
  },

  validateCoupon: (planId, code) => {
    return request('/api/campaigns/validate-discount', {
      method: 'POST',
      body: { plan_id: planId, code }
    });
  },

  createOrder: (planId, referralCode = null, attemptId = null) => {
    return request('/api/payment/create-order', {
      method: 'POST',
      body: {
        plan_id: planId,
        referral_code: referralCode,
        attempt_id: attemptId
      }
    });
  },

  verifyPayment: (razorpayOrderId, razorpayPaymentId, razorpaySignature, attemptId = null) => {
    return request('/api/payment/verify', {
      method: 'POST',
      body: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        attempt_id: attemptId
      }
    });
  },

  redeemZero: (planId, referralCode, attemptId = null) => {
    return request('/api/payments/redeem-zero', {
      method: 'POST',
      body: {
        plan_id: planId,
        referral_code: referralCode,
        attempt_id: attemptId
      }
    });
  },

  cancelOrder: (orderId) => {
    return request('/api/payments/cancel', {
      method: 'POST',
      body: { order_id: orderId }
    });
  }
};
