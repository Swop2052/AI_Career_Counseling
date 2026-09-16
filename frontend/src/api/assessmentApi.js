// frontend/src/api/assessmentApi.js - Quiz submission, attempt retrieval & unlocking
import { request } from './client';

export const assessmentApi = {
  submitAnswers: (answers, studentInfo, language = 'en') => {
    return request('/api/submit-answers', {
      method: 'POST',
      body: {
        answers,
        student_info: studentInfo,
        language
      }
    });
  },

  getTeaser: (attemptId, language = 'en') => {
    return request(`/api/assessment/${attemptId}/teaser?lang=${language}`, {
      method: 'GET'
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
