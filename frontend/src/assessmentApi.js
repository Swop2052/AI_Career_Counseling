// frontend/src/api/assessmentApi.js - Quiz submission, attempt retrieval & unlocking
import { request } from './client';

export const assessmentApi = {
  submitAnswers: (answers, studentInfo, language = 'en', submissionToken = null) => {
    const token = submissionToken || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return request('/api/submit-answers', {
      method: 'POST',
      body: {
        answers,
        student_info: studentInfo,
        language,
        submission_token: token
      }
    });
  },

  getTeaser: (attemptId, language = 'en') => {
    return request(`/api/assessment/${attemptId}/teaser?lang=${language}`, {
      method: 'GET'
    });
  },

  getStatus: (attemptId) => {
    return request(`/api/assessment/${attemptId}/status`, {
      method: 'GET'
    });
  },

  claimAttempt: (attemptId) => {
    return request(`/api/assessment/${attemptId}/claim`, {
      method: 'POST'
    });
  },

  getFullReport: (attemptId, language = 'en') => {
    return request(`/api/assessment/${attemptId}/full?lang=${language}`, {
      method: 'GET'
    });
  },

  unlockAttempt: (attemptId) => {
    return request(`/api/assessment/${attemptId}/unlock`, {
      method: 'POST'
    });
  },

  getAccountSummary: () => {
    return request('/api/account/summary', {
      method: 'GET'
    });
  },

  clearPendingAttempt: () => {
    return request('/api/session/clear-pending', {
      method: 'POST'
    });
  }
};
