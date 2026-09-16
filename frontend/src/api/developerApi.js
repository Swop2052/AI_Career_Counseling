// frontend/src/api/developerApi.js - Live analytics, pricing management, campaigns, credit adjustment & developer accounts
import { request } from './client';

export const developerApi = {
  getStats: () => {
    return request('/api/developer/stats', { method: 'GET' });
  },

  verifySuperAdmin: () => {
    return request('/api/developer/verify-super-admin', { method: 'GET' });
  },

  getPlans: () => {
    return request('/api/developer/plans', { method: 'GET' });
  },

  createPlan: (planData) => {
    return request('/api/developer/plans', {
      method: 'POST',
      body: planData
    });
  },

  updatePlan: (planId, planData) => {
    return request(`/api/developer/plans/${planId}`, {
      method: 'PUT',
      body: planData
    });
  },

  deletePlan: (planId) => {
    return request(`/api/developer/plans/${planId}`, {
      method: 'DELETE'
    });
  },

  togglePlan: (planId, isActive) => {
    return request(`/api/developer/plans/${planId}/toggle`, {
      method: 'POST',
      body: { is_active: isActive }
    });
  },

  adjustCredits: (email, amount, description) => {
    return request('/api/developer/credits/adjust', {
      method: 'POST',
      body: { email, amount, description }
    });
  },

  getCampaigns: () => {
    return request('/api/developer/campaigns', { method: 'GET' });
  },

  createCampaign: (campaignData) => {
    return request('/api/developer/campaigns', {
      method: 'POST',
      body: campaignData
    });
  },

  toggleCampaign: (codeId, isActive) => {
    return request(`/api/developer/campaigns/${codeId}/toggle`, {
      method: 'POST',
      body: { is_active: isActive }
    });
  },

  getCampaignRedemptions: (codeId) => {
    return request(`/api/developer/campaigns/${codeId}/redemptions`, { method: 'GET' });
  },

  getAccounts: () => {
    return request('/api/developer/accounts', { method: 'GET' });
  },

  inviteDeveloper: (email, fullName, role = 'DEVELOPER', canManage = 0) => {
    return request('/api/developer/accounts/invite', {
      method: 'POST',
      body: { email, full_name: fullName, role, can_manage_developers: canManage }
    });
  },

  resendInvitation: (email) => {
    return request('/api/developer/accounts/resend-invite', {
      method: 'POST',
      body: { email }
    });
  },

  setAccountStatus: (targetId, isActive) => {
    return request(`/api/developer/accounts/${targetId}/status`, {
      method: 'POST',
      body: { is_active: isActive }
    });
  },

  deleteAccount: (targetId) => {
    return request(`/api/developer/accounts/${targetId}`, {
      method: 'DELETE'
    });
  },

  updatePermissions: (targetId, canManage) => {
    return request(`/api/developer/accounts/${targetId}/permissions`, {
      method: 'POST',
      body: { can_manage_developers: canManage }
    });
  },

  getUsers: () => {
    return request('/api/developer/users', { method: 'GET' });
  },

  setUserStatus: (userId, isActive) => {
    return request(`/api/developer/users/${userId}/status`, {
      method: 'POST',
      body: { is_active: isActive }
    });
  },

  getAuditLogs: (limit = 100) => {
    return request(`/api/developer/audit-log?limit=${limit}`, { method: 'GET' });
  }
};
