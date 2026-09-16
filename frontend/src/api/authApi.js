// frontend/src/api/authApi.js - Authentication, account management & session hydration
import { request } from './client';

export const authApi = {
  signup: (email, password, fullName, attemptId = null, phone = null, educationLevel = null) => {
    return request('/api/auth/signup', {
      method: 'POST',
      body: {
        email,
        password,
        full_name: fullName,
        attempt_id: attemptId,
        phone,
        education_level: educationLevel
      }
    });
  },

  login: (email, password, attemptId = null) => {
    return request('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
        attempt_id: attemptId
      }
    });
  },

  logout: () => {
    return request('/api/auth/logout', {
      method: 'POST'
    });
  },

  getMe: () => {
    return request('/api/auth/me', {
      method: 'GET'
    });
  },

  forgotPassword: (email) => {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  verifyOtp: (email, otp) => {
    return request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, otp }
    });
  },

  resetPassword: (email, token, password) => {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: { email, token, password }
    });
  },

  setupAccount: (token, password, fullName = '') => {
    return request('/api/auth/setup-account', {
      method: 'POST',
      body: { token, password, full_name: fullName }
    });
  }
};
