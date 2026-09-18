import { Sparkles } from 'lucide-react';
import { authApi } from './api/authApi';
import { assessmentApi } from './api/assessmentApi';
import DeveloperDashboard from './components/developer/DeveloperDashboard';
import SuperAdminDashboard from './components/developer/SuperAdminDashboard';
import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar/Navbar';
import ProfilePage from './components/navbar/ProfilePage';
import AICounselorPage from './components/navbar/AICounselorPage';
import Home from './components/home_sections/Home';
import Footer from './Footer';
import AICounselor from './Aicounselor';

// Flow Modules
import CareerTestModule from './components/career_test';
import ReportCardPage from './components/ReportCardPage';
import PricingPage from './components/PricingPage';
import Login from './components/auth/login';
import Signup from './components/auth/signup';
import AssessmentOnboarding from './components/AssessmentOnboarding';
import CanonicalModal from './components/common/CanonicalModal';

// Separate Legal Pages
import TermsConditions from './components/auth/TermsConditions';
import PrivacyPolicy from './components/auth/PrivacyPolicy';
import ConsentForm from './components/auth/ConsentForm';
import AcceptInvitation from './components/auth/AcceptInvitation';
import { isSuperAdmin, isDeveloper, canAccessDeveloperConsole } from './utils/roleUtils';
import { resolveAvatarUrl, normalizeAvatarKey, DEFAULT_AVATAR_KEY } from './utils/avatarUtils';

// Session-aware active assessment flow state helpers
export const getActiveAssessmentFlow = () => {
  try {
    const raw = sessionStorage.getItem('skillsense_active_assessment_flow');
    if (!raw) return null;
    const flow = JSON.parse(raw);
    if (!flow || !flow.attemptId || flow.dismissed) return null;
    if (flow.completedAt && (Date.now() - flow.completedAt > 2 * 60 * 60 * 1000)) {
      return null;
    }
    return flow;
  } catch {
    return null;
  }
};

export const updateAssessmentFlow = (updates) => {
  try {
    const raw = sessionStorage.getItem('skillsense_active_assessment_flow');
    const existing = raw ? JSON.parse(raw) : {};
    const updated = { ...existing, ...updates };
    sessionStorage.setItem('skillsense_active_assessment_flow', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to update assessment flow:', e);
    return null;
  }
};

export const clearAssessmentFlow = () => {
  try {
    sessionStorage.removeItem('skillsense_active_assessment_flow');
    localStorage.removeItem('skillsense_return_to_unlock');
    localStorage.removeItem('skillsense_pending_attempt_id');
    localStorage.removeItem('skillsense_saved_attempt_id');
  } catch {}
};

class ReportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Report render error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6] m-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#09A3A3] flex items-center justify-center mb-4 shadow-sm border border-teal-100">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#04302E] mb-2 font-['Sora']">
            Your Assessment is Ready
          </h2>
          <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
            Your assessment responses have been saved securely. Click below to view your personalized report.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 rounded-xl bg-[#04302E] hover:bg-[#064e4a] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Refresh Report
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isPurchased, setIsPurchased] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [tempStudentName, setTempStudentName] = useState('');
  const [savedAttemptId, setSavedAttemptId] = useState(() => getActiveAssessmentFlow()?.attemptId || null);
  const [globalModal, setGlobalModal] = useState(null); // { type, title, eyebrow, description, balance, primaryAction, secondaryAction, footerText }
  const [successToast, setSuccessToast] = useState(null); // { message, visible, isError }

  const [onboardingData, setOnboardingData] = useState(() => {
    try {
      const savedData = localStorage.getItem('skillsense_onboarding');
      if (!savedData) return null;
      const parsed = JSON.parse(savedData);
      if (parsed && typeof parsed === 'object') {
        if (parsed.fullName && ['guest', 'guest student', 'test student'].includes(String(parsed.fullName).toLowerCase())) {
          parsed.fullName = '';
        }
        if (parsed.age !== undefined && parsed.age !== null) {
          const num = parseInt(parsed.age, 10);
          if (isNaN(num) || num < 10 || num > 60) {
            parsed.age = '';
          }
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('skillsense_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [reportData, setReportData] = useState(() => {
    try {
      const savedReport = localStorage.getItem('skillsense_report');
      return savedReport ? JSON.parse(savedReport) : null;
    } catch {
      return null;
    }
  });

  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setAppConfig(data))
      .catch(err => console.error("Failed to load app config", err));

    // Hydrate authenticated user session from backend
    authApi.getMe()
      .then(res => {
        if (res && res.authenticated && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('skillsense_user', JSON.stringify(res.user));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('skillsense_user');
        }
      })
      .catch(() => {});
  }, []);

  // Sync route and reset scroll on navigation with role guards
  useEffect(() => {
    const syncPageWithHash = () => {
      const hash = window.location.hash;
      const cachedUser = (() => {
        try {
          const s = localStorage.getItem('skillsense_user');
          return s ? JSON.parse(s) : null;
        } catch {
          return null;
        }
      })();
      const activeUser = currentUser || cachedUser;

      if (hash === '#onboarding') setCurrentPage('onboarding');
      else if (hash === '#test') setCurrentPage('test');
      else if (hash === '#report') setCurrentPage('report');
      else if (hash === '#pricing') setCurrentPage('pricing');
      else if (hash === '#login') setCurrentPage('login');
      else if (hash === '#signup') setCurrentPage('signup');
      else if (hash === '#terms') setCurrentPage('terms');
      else if (hash === '#privacy') setCurrentPage('privacy');
      else if (hash === '#profile') setCurrentPage('profile');
      else if (hash === '#developer') {
        if (canAccessDeveloperConsole(activeUser)) {
          setCurrentPage('developer');
        } else {
          setCurrentPage('home');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      else if (hash === '#admin') {
        if (isSuperAdmin(activeUser)) {
          setCurrentPage('admin');
        } else if (isDeveloper(activeUser)) {
          setCurrentPage('developer');
          window.history.replaceState(null, '', '#developer');
        } else {
          setCurrentPage('home');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      else if (hash.startsWith('#accept-invite')) setCurrentPage('accept-invite');
      else if (hash === '#ai-counselor') {
        setCurrentPage('counselor');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        setCurrentPage('home');
      }
    };

    syncPageWithHash();
    window.addEventListener('hashchange', syncPageWithHash);
    return () => window.removeEventListener('hashchange', syncPageWithHash);
  }, [currentUser]);

  // Route security guard: adjust current page when user state hydrates or updates
  useEffect(() => {
    if (currentPage === 'admin') {
      if (currentUser && !isSuperAdmin(currentUser)) {
        if (isDeveloper(currentUser)) {
          navigateTo('developer', '#developer');
        } else {
          navigateTo('home', '');
        }
      }
    } else if (currentPage === 'developer') {
      if (currentUser && !canAccessDeveloperConsole(currentUser)) {
        navigateTo('home', '');
      }
    }
  }, [currentUser, currentPage]);

  // Server-authoritative verification of report unlock status
  useEffect(() => {
    if (currentPage === 'report' && currentUser && reportData?.attempt_id) {
      assessmentApi.getFullReport(reportData.attempt_id)
        .then(res => {
          if (res?.full_report) {
            const updated = {
              ...res.full_report,
              is_unlocked: 1,
              attempt_id: reportData.attempt_id,
              scores: res.full_report.scores || res.full_report.riasec_scores,
              top_careers: res.full_report.top_careers
            };
            setReportData(updated);
            localStorage.setItem('skillsense_report', JSON.stringify(updated));
            setIsPurchased(true);
          }
        })
        .catch(() => {
          // If server reports locked (e.g. 403), strictly enforce locked state
          setIsPurchased(false);
          if (reportData.is_unlocked !== 0) {
            setReportData(prev => prev ? { ...prev, is_unlocked: 0 } : prev);
          }
        });
    }
  }, [currentPage, currentUser?.id, reportData?.attempt_id]);

  const navigateTo = (page, hash = '') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (hash) {
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    } else {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const handleStartCareerTest = () => {
    setIsPurchased(false);
    setReportData(null);
    navigateTo('onboarding', '#onboarding');
  };

  const handleOnboardingComplete = (formData) => {
    setOnboardingData(formData);
    localStorage.setItem('skillsense_onboarding', JSON.stringify(formData));
    if (formData?.fullName) {
      setTempStudentName(formData.fullName);
    }
    setIsPurchased(false);
    if (currentUser) {
      const canonicalAvatar = normalizeAvatarKey(formData.avatar || formData.profilePhoto) || DEFAULT_AVATAR_KEY;
      const avatarUrl = resolveAvatarUrl(canonicalAvatar);
      const updatedUser = {
        ...currentUser,
        name: formData.fullName || currentUser.name,
        full_name: formData.fullName || currentUser.full_name,
        age: formData.age ? parseInt(formData.age, 10) : currentUser.age,
        class_year: formData.classYear || currentUser.class_year,
        enjoy_subjects: formData.enjoySubjects || currentUser.enjoy_subjects,
        challenging_subjects: formData.challengingSubjects || currentUser.challenging_subjects,
        avatar: canonicalAvatar,
        profilePhoto: avatarUrl || formData.profilePhoto
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('skillsense_user', JSON.stringify(updatedUser));

      // Persist to PostgreSQL backend
      authApi.updateProfile({
        full_name: formData.fullName,
        fullName: formData.fullName,
        name: formData.fullName,
        age: formData.age ? parseInt(formData.age, 10) : null,
        class_year: formData.classYear,
        classYear: formData.classYear,
        stream: formData.stream,
        enjoy_subjects: formData.enjoySubjects,
        enjoySubjects: formData.enjoySubjects,
        challenging_subjects: formData.challengingSubjects,
        challengingSubjects: formData.challengingSubjects,
        avatar: canonicalAvatar
      }).then(res => {
        if (res && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('skillsense_user', JSON.stringify(res.user));
        }
      }).catch(err => {
        console.warn('Failed to sync profile to backend:', err);
      });
    }
    navigateTo('test', '#test');
  };

  const handleCompleteTest = (data) => {
    if (data && data.student_info?.fullName) {
      setTempStudentName(data.student_info.fullName);
    }
    const attemptId = data?.attempt_id;
    if (attemptId) {
      const flow = {
        attemptId: attemptId,
        flowState: 'guest_completed',
        completedAt: Date.now(),
        dismissed: false
      };
      sessionStorage.setItem('skillsense_active_assessment_flow', JSON.stringify(flow));
      localStorage.setItem('skillsense_return_to_unlock', attemptId);
      localStorage.setItem('skillsense_pending_attempt_id', attemptId);
      setSavedAttemptId(attemptId);
    }
    setIsPurchased(false);
    const freshReport = { ...data, is_unlocked: 0, attempt_id: attemptId };
    setReportData(freshReport);
    localStorage.setItem('skillsense_report', JSON.stringify(freshReport));

    // Route directly to report page
    navigateTo('report', '#report');

    if (currentUser && attemptId) {
      // Authenticated user completed assessment: authoritative backend status & balance check
      assessmentApi.getStatus(attemptId)
        .then(async (statusRes) => {
          if (!statusRes?.exists) return;
          if (statusRes.is_unlocked) {
            setIsPurchased(true);
            updateAssessmentFlow({ flowState: 'unlocked' });
            return;
          }
          const meRes = await authApi.getMe().catch(() => null);
          const liveUser = meRes?.user || currentUser;
          if (meRes?.user) {
            setCurrentUser(liveUser);
            localStorage.setItem('skillsense_user', JSON.stringify(liveUser));
          }
          const userBalance = liveUser?.balance ?? 0;
          if (userBalance >= 1) {
            updateAssessmentFlow({ attemptId, flowState: 'credits_available_for_attempt', dismissed: false });
          } else {
            updateAssessmentFlow({ attemptId, flowState: 'awaiting_credits', dismissed: false });
          }
        })
        .catch(() => {
          const fallbackBalance = currentUser?.balance ?? 0;
          if (fallbackBalance >= 1) {
            updateAssessmentFlow({ attemptId, flowState: 'credits_available_for_attempt', dismissed: false });
          } else {
            updateAssessmentFlow({ attemptId, flowState: 'awaiting_credits', dismissed: false });
          }
        });
    }
  };

  const handleSignupSuccess = async (userData, claimedAttemptId) => {
    const user = userData || { name: tempStudentName || onboardingData?.fullName || 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    const activeFlow = getActiveAssessmentFlow();
    const activeAttempt = claimedAttemptId ||
                          activeFlow?.attemptId ||
                          localStorage.getItem('skillsense_return_to_unlock') ||
                          localStorage.getItem('skillsense_pending_attempt_id') ||
                          reportData?.attempt_id;

    try {
      const res = await authApi.getMe().catch(() => null);
      const liveUser = res?.user || user;
      if (res?.user) {
        setCurrentUser(liveUser);
        localStorage.setItem('skillsense_user', JSON.stringify(liveUser));
      }

      // If no valid recent pending assessment flow from this session:
      if (!activeAttempt) {
        navigateTo('profile', '#profile');
        return;
      }

      // 1. Authoritatively claim attempt on backend
      try {
        await assessmentApi.claimAttempt(activeAttempt);
      } catch (claimErr) {
        console.warn('Could not explicitly claim assessment:', claimErr);
      }

      // 2. Fetch authoritative assessment status
      const statusRes = await assessmentApi.getStatus(activeAttempt);
      if (!statusRes?.exists) {
        setSuccessToast({
          message: 'Unable to retrieve your assessment. It is saved in your profile history if linked.',
          visible: true,
          isError: true
        });
        navigateTo('profile', '#profile');
        return;
      }

      if (!statusRes?.is_owner) {
        setSuccessToast({
          message: 'Assessment attempt is already associated with another account.',
          visible: true,
          isError: true
        });
        navigateTo('profile', '#profile');
        return;
      }

      // Hydrate teaser report data if not already present
      if (!reportData || reportData.attempt_id !== activeAttempt) {
        try {
          const tRes = await assessmentApi.getTeaser(activeAttempt);
          const teaser = tRes?.teaser || tRes;
          const rData = {
            ...teaser,
            attempt_id: activeAttempt,
            is_unlocked: 0
          };
          setReportData(rData);
          localStorage.setItem('skillsense_report', JSON.stringify(rData));
        } catch {}
      }

      if (statusRes.is_unlocked) {
        setIsPurchased(true);
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'unlocked', dismissed: false });
        navigateTo('report', '#report');
        return;
      }

      const userBalance = liveUser?.balance ?? 0;
      if (userBalance >= 1) {
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'credits_available_for_attempt', dismissed: false });
      } else {
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'awaiting_credits', dismissed: false });
      }
      navigateTo('report', '#report');
    } catch (e) {
      console.warn('Could not verify assessment status on signup:', e);
      navigateTo('profile', '#profile');
    }
  };

  const handleLoginSuccess = async (userData, claimedAttemptId) => {
    const user = userData || { name: 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    const activeFlow = getActiveAssessmentFlow();
    const activeAttempt = claimedAttemptId ||
                          activeFlow?.attemptId ||
                          localStorage.getItem('skillsense_return_to_unlock') ||
                          localStorage.getItem('skillsense_pending_attempt_id') ||
                          reportData?.attempt_id;

    try {
      const res = await authApi.getMe().catch(() => null);
      const liveUser = res?.user || user;
      if (res?.user) {
        setCurrentUser(liveUser);
        localStorage.setItem('skillsense_user', JSON.stringify(liveUser));
      }

      const goToNormalDestination = () => {
        if (liveUser.role === 'SUPER_ADMIN') {
          navigateTo('admin', '#admin');
        } else if (liveUser.role === 'DEVELOPER') {
          navigateTo('developer', '#developer');
        } else {
          navigateTo('profile', '#profile');
        }
      };

      // If no valid recent pending assessment flow from this session:
      if (!activeAttempt || (activeFlow?.dismissed && !claimedAttemptId && !localStorage.getItem('skillsense_return_to_unlock'))) {
        goToNormalDestination();
        return;
      }

      // 1. Authoritatively claim attempt on backend
      try {
        await assessmentApi.claimAttempt(activeAttempt);
      } catch (claimErr) {
        console.warn('Could not explicitly claim assessment on login:', claimErr);
      }

      // 2. Fetch authoritative assessment status
      const statusRes = await assessmentApi.getStatus(activeAttempt);
      if (!statusRes?.exists || !statusRes?.is_owner) {
        goToNormalDestination();
        return;
      }

      // Hydrate teaser report data if needed
      if (!reportData || reportData.attempt_id !== activeAttempt) {
        try {
          const tRes = await assessmentApi.getTeaser(activeAttempt);
          const teaser = tRes?.teaser || tRes;
          const rData = {
            ...teaser,
            attempt_id: activeAttempt,
            is_unlocked: 0
          };
          setReportData(rData);
          localStorage.setItem('skillsense_report', JSON.stringify(rData));
        } catch {}
      }

      if (statusRes.is_unlocked) {
        setIsPurchased(true);
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'unlocked', dismissed: false });
        navigateTo('report', '#report');
        return;
      }

      const userBalance = liveUser?.balance ?? 0;
      if (userBalance >= 1) {
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'credits_available_for_attempt', dismissed: false });
      } else {
        updateAssessmentFlow({ attemptId: activeAttempt, flowState: 'awaiting_credits', dismissed: false });
      }
      navigateTo('report', '#report');
    } catch (e) {
      console.warn('Could not verify assessment status on login:', e);
      navigateTo('profile', '#profile');
    }
  };

  const handlePurchaseSuccess = async (purchaseRes) => {
    try {
      const meRes = await authApi.getMe();
      if (meRes && meRes.user) {
        setCurrentUser(meRes.user);
        localStorage.setItem('skillsense_user', JSON.stringify(meRes.user));
      }
    } catch (e) {
      console.warn('[handlePurchaseSuccess] Failed to refresh session:', e);
    }

    let target = null;
    try {
      const rawTarget = sessionStorage.getItem('skillsense_unlock_target');
      if (rawTarget) target = JSON.parse(rawTarget);
    } catch (e) {}

    const returnAttemptId = target?.attemptId ||
                           localStorage.getItem('skillsense_return_to_unlock');

    if (returnAttemptId) {
      try {
        const statusRes = await assessmentApi.getStatus(returnAttemptId);
        if (statusRes?.exists && !statusRes.is_unlocked) {
          const dateStr = target?.date || (statusRes.created_at ? new Date(statusRes.created_at).toLocaleDateString() : 'Recent');
          const titleStr = target?.title || (statusRes.riasec_code ? `RIASEC: ${statusRes.riasec_code}` : 'Career Assessment');

          // Explicit SkillSense canonical modal: DO NOT silently consume credit
          setGlobalModal({
            eyebrow: 'CREDIT ADDED',
            title: 'Credit Added Successfully',
            description: `Your credit has been added successfully. Unlock this assessment (${titleStr} from ${dateStr}) with 1 credit?`,
            primaryAction: {
              label: 'Unlock This Report',
              onClick: () => {
                setGlobalModal(null);
                handleUnlock(returnAttemptId);
              }
            },
            secondaryAction: {
              label: 'Not Now',
              onClick: () => {
                setGlobalModal(null);
                sessionStorage.removeItem('skillsense_unlock_target');
                localStorage.removeItem('skillsense_return_to_unlock');
                navigateTo('profile', '#profile');
              }
            }
          });
          return;
        } else if (statusRes?.is_unlocked) {
          setIsPurchased(true);
          sessionStorage.removeItem('skillsense_unlock_target');
          localStorage.removeItem('skillsense_return_to_unlock');
          navigateTo('profile', '#profile');
          return;
        }
      } catch (err) {
        console.warn('Failed to verify return attempt status:', err);
      }
    }

    sessionStorage.removeItem('skillsense_unlock_target');
    localStorage.removeItem('skillsense_return_to_unlock');
    const msg = purchaseRes?.message || `${purchaseRes?.credits_granted || 1} credit(s) added successfully to your account.`;
    setSuccessToast({ message: msg, visible: true });
    navigateTo('profile', '#profile');
  };

  // Centralized, debounced unlock handler with atomic credit deduction and state updates
  const handleUnlock = async (attemptId) => {
    if (!attemptId || isUnlocking) return;
    setIsUnlocking(true);
    try {
      const res = await assessmentApi.unlockAttempt(attemptId);
      setIsPurchased(true);
      const report = res?.full_report || reportData || {};
      const updated = {
        ...report,
        is_unlocked: 1,
        attempt_id: attemptId,
        scores: report.scores || report.riasec_scores,
        top_careers: report.top_careers
      };
      setReportData(updated);
      localStorage.setItem('skillsense_report', JSON.stringify(updated));
      sessionStorage.removeItem('skillsense_unlock_target');
      localStorage.removeItem('skillsense_return_to_unlock');
      sessionStorage.removeItem('skillsense_active_assessment_flow');

      // Refresh authoritative user session & balance from server
      if (typeof res?.credits_remaining === 'number') {
        setCurrentUser(prev => prev ? { ...prev, balance: res.credits_remaining } : prev);
      }
      const meRes = await authApi.getMe();
      if (meRes?.user) {
        setCurrentUser(meRes.user);
        localStorage.setItem('skillsense_user', JSON.stringify(meRes.user));
      }

      setGlobalModal(null);
      setSuccessToast({ message: 'Career roadmap unlocked successfully!', visible: true });
      navigateTo('report', '#report');
    } catch (err) {
      console.error('[handleUnlock] Unlock failed:', err);
      const isInsufficient = err?.status === 402 || err?.data?.insufficient_credits;
      if (isInsufficient) {
        localStorage.setItem('skillsense_return_to_unlock', attemptId);
        navigateTo('pricing', '#pricing');
      } else {
        const errorMsg = err?.message || err?.data?.error || 'Failed to unlock assessment report. Your credit is preserved.';
        setSuccessToast({ message: errorMsg, isError: true, visible: true });
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    clearAssessmentFlow();
    localStorage.removeItem('skillsense_user');
    localStorage.removeItem('skillsense_onboarding');
    localStorage.removeItem('skillsense_report');
    setCurrentUser(null);
    setIsPurchased(false);
    setTempStudentName('');
    setOnboardingData(null);
    setReportData(null);
    setGlobalModal(null);
    navigateTo('home', '');
  };

  const activeReportUser = currentUser || (tempStudentName || onboardingData?.fullName ? {
    name: tempStudentName || onboardingData?.fullName,
    grade: onboardingData?.classYear,
    avatar: normalizeAvatarKey(onboardingData?.avatar || onboardingData?.profilePhoto) || DEFAULT_AVATAR_KEY,
    profilePhoto: resolveAvatarUrl(onboardingData?.avatar || onboardingData?.profilePhoto) || onboardingData?.profilePhoto
  } : null);
  const isFullScreenPage = ['login', 'signup', 'test', 'terms', 'privacy', 'onboarding', 'developer', 'admin', 'accept-invite'].includes(currentPage);

  if (!appConfig) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#CFEDED]">
        <div className="animate-spin w-8 h-8 border-4 border-[#09A3A3] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen overflow-x-hidden flex flex-col justify-between ${isFullScreenPage ? 'bg-white pt-0' : 'bg-[#CFEDED] pt-12 md:pt-20'
        }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Global Navbar */}
      {!isFullScreenPage && (
        <Navbar
          isLoggedIn={Boolean(currentUser)}
          user={currentUser}
          onOpenLogin={() => navigateTo('login', '#login')}
          onOpenSignup={() => navigateTo('signup', '#signup')}
          onOpenProfile={() => navigateTo('profile', '#profile')}
          onOpenDeveloper={() => navigateTo('developer', '#developer')}
          onOpenAdmin={() => navigateTo('admin', '#admin')}
          onOpenCounselor={() => navigateTo('counselor', '#ai-counselor')}
          onHomeClick={() => navigateTo('home', '')}
          onStartCareerTest={handleStartCareerTest}
          onLogout={handleLogout}
        />
      )}

      {/* Main Views Routing */}
      <main className="flex-grow w-full">
        {currentPage === 'home' && (
          <Home onStartTest={handleStartCareerTest} />
        )}

        {currentPage === 'onboarding' && (
          <AssessmentOnboarding
            onComplete={handleOnboardingComplete}
            onBackToHome={() => navigateTo('home', '')}
            initialData={onboardingData}
            currentUser={currentUser}
          />
        )}

        {currentPage === 'test' && (
          <CareerTestModule
            userMetadata={onboardingData}
            appConfig={appConfig}
            onCompleteTest={handleCompleteTest}
            onExit={() => navigateTo('home', '')}
          />
        )}

        {currentPage === 'report' && (
          <ReportErrorBoundary>
            <ReportCardPage
              user={activeReportUser}
              currentUser={currentUser}
              reportData={reportData}
              isPurchased={Boolean(reportData?.is_unlocked === 1 || reportData?.is_unlocked === true)}
              suppressLockedModal={Boolean(globalModal)}
              onCreateAccount={() => navigateTo('signup', '#signup')}
              onBack={() => navigateTo(currentUser ? 'profile' : 'home', currentUser ? '#profile' : '')}
              onGoToPricing={() => {
                const attemptId = reportData?.attempt_id ||
                                  getActiveAssessmentFlow()?.attemptId;
                if (attemptId) {
                  updateAssessmentFlow({ attemptId, flowState: 'awaiting_credits' });
                  localStorage.setItem('skillsense_return_to_unlock', attemptId);
                  localStorage.setItem('skillsense_pending_attempt_id', attemptId);
                }
                navigateTo('pricing', '#pricing');
              }}
              onUnlockReport={async () => {
                const attemptId = reportData?.attempt_id ||
                                  getActiveAssessmentFlow()?.attemptId;
                if (attemptId) {
                  await handleUnlock(attemptId);
                } else {
                  setSuccessToast({
                    message: 'Assessment attempt details not found. Please retake the test or select an attempt from Profile.',
                    visible: true,
                    isError: true
                  });
                }
              }}
            />
          </ReportErrorBoundary>
        )}

        {currentPage === 'signup' && (
          <Signup
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => navigateTo('login', '#login')}
            onHome={() => navigateTo('home', '')}
            onOpenTerms={() => navigateTo('terms', '#terms')}
            onOpenPrivacy={() => navigateTo('privacy', '#privacy')}
            onOpenConsent={() => navigateTo('consent', '#consent')}
          />
        )}

        {currentPage === 'login' && (
          <Login
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => navigateTo('signup', '#signup')}
            onBack={() => navigateTo('home', '')}
            onHome={() => navigateTo('home', '')}
          />
        )}

        {currentPage === 'accept-invite' && (
          <AcceptInvitation
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              localStorage.setItem('skillsense_user', JSON.stringify(user));
              if (user?.role === 'SUPER_ADMIN') {
                navigateTo('admin', '#admin');
              } else if (user?.role === 'DEVELOPER') {
                navigateTo('developer', '#developer');
              } else {
                navigateTo('profile', '#profile');
              }
            }}
            onGoToLogin={() => navigateTo('login', '#login')}
          />
        )}

        {/* Independent Terms & Conditions Page */}
        {currentPage === 'terms' && (
          <TermsConditions
            onBack={() => navigateTo('signup', '#signup')}
            onHome={() => navigateTo('home', '')}
          />
        )}

        {/* Independent Privacy Policy Page */}
        {currentPage === 'privacy' && (
          <PrivacyPolicy
            onBack={() => navigateTo('signup', '#signup')}
            onHome={() => navigateTo('home', '')}
          />
        )}

        {/* Independent Consent Form Page */}
        {currentPage === 'consent' && (
          <ConsentForm
            onBack={() => navigateTo('signup', '#signup')}
            onHome={() => navigateTo('home', '')}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            user={currentUser}
            isLoggedIn={Boolean(currentUser)}
            onPurchaseSuccess={handlePurchaseSuccess}
            onBack={() => navigateTo('home', '')}
            onRequireAuth={() => navigateTo('login', '#login')}
            onOpenLogin={() => navigateTo('login', '#login')}
            onOpenSignup={() => navigateTo('signup', '#signup')}
            reportData={reportData}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            user={currentUser}
            onboardingData={onboardingData}
            isPurchased={isPurchased}
            onBack={() => navigateTo('home', '')}
            onGoToPricing={() => navigateTo('pricing', '#pricing')}
            onUnlockReport={() => navigateTo('report', '#report')}
            onViewReport={(selectedAttempt) => {
              if (selectedAttempt && selectedAttempt.id) {
                if (selectedAttempt.is_unlocked) {
                  if (selectedAttempt.full_report && selectedAttempt.full_report.top_careers) {
                    const fullData = selectedAttempt.full_report;
                    const normalized = {
                      ...fullData,
                      attempt_id: selectedAttempt.id,
                      is_unlocked: 1,
                      scores: fullData?.scores || fullData?.riasec_scores,
                      top_careers: fullData?.top_careers
                    };
                    setReportData(normalized);
                    localStorage.setItem('skillsense_report', JSON.stringify(normalized));
                    setIsPurchased(true);
                    navigateTo('report', '#report');
                  } else {
                    assessmentApi.getFullReport(selectedAttempt.id)
                      .then((res) => {
                        const fullData = res?.full_report || res?.report || res?.attempt || res;
                        const normalized = {
                          ...fullData,
                          attempt_id: res?.attempt_id || selectedAttempt.id,
                          is_unlocked: 1,
                          scores: fullData?.scores || fullData?.riasec_scores,
                          top_careers: fullData?.top_careers
                        };
                        setReportData(normalized);
                        localStorage.setItem('skillsense_report', JSON.stringify(normalized));
                        setIsPurchased(true);
                        navigateTo('report', '#report');
                      })
                      .catch((err) => {
                        console.error("Failed to load full report:", err);
                        navigateTo('report', '#report');
                      });
                  }
                } else {
                  // If viewing a locked attempt from history:
                  setIsPurchased(false);
                  assessmentApi.getTeaser(selectedAttempt.id)
                    .then((tRes) => {
                      const teaser = tRes?.teaser || {};
                      const lockedData = {
                        ...selectedAttempt,
                        attempt_id: selectedAttempt.id,
                        is_unlocked: 0,
                        riasec_code: teaser.riasec_code || selectedAttempt.riasec_code,
                        primary_career_title: teaser.primary_career_title || selectedAttempt.primary_career_title
                      };
                      setReportData(lockedData);
                      localStorage.setItem('skillsense_report', JSON.stringify(lockedData));
                      setSavedAttemptId(selectedAttempt.id);
                      localStorage.setItem('skillsense_return_to_unlock', selectedAttempt.id);
                      navigateTo('report', '#report');
                    })
                    .catch(() => {
                      const lockedData = {
                        ...selectedAttempt,
                        attempt_id: selectedAttempt.id,
                        is_unlocked: 0
                      };
                      setReportData(lockedData);
                      localStorage.setItem('skillsense_report', JSON.stringify(lockedData));
                      setSavedAttemptId(selectedAttempt.id);
                      localStorage.setItem('skillsense_return_to_unlock', selectedAttempt.id);
                      navigateTo('report', '#report');
                    });
                }
              } else {
                navigateTo('report', '#report');
              }
            }}
            onSave={(updatedData) => {
              if (currentUser) {
                const updatedUser = { ...currentUser, ...updatedData };
                setCurrentUser(updatedUser);
                localStorage.setItem('skillsense_user', JSON.stringify(updatedUser));
              }
              if (onboardingData) {
                const updatedOnboarding = { ...onboardingData, ...updatedData };
                setOnboardingData(updatedOnboarding);
                localStorage.setItem('skillsense_onboarding', JSON.stringify(updatedOnboarding));
              }
            }}
          />
        )}

        {currentPage === 'developer' && (
          canAccessDeveloperConsole(currentUser) ? (
            <DeveloperDashboard
              currentUser={currentUser}
              onBackToSite={() => navigateTo('home', '')}
              onLogout={handleLogout}
            />
          ) : (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#F8FCFC]">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 font-black text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-[#0B1F1D] mb-2">Access Restricted</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                Developer privileges are required to view this console.
              </p>
              <button
                onClick={() => navigateTo('home', '')}
                className="px-5 py-2.5 rounded-xl bg-[#09A3A3] text-white font-bold text-xs hover:bg-[#088F8F] cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          )
        )}

        {currentPage === 'admin' && (
          isSuperAdmin(currentUser) ? (
            <SuperAdminDashboard
              currentUser={currentUser}
              onBackToSite={() => navigateTo('home', '')}
              onLogout={handleLogout}
            />
          ) : (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#F8FCFC]">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 font-black text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-[#0B1F1D] mb-2">Super Admin Role Required</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                You do not have administrative authority to access the Super Admin Console.
              </p>
              <button
                onClick={() => navigateTo(isDeveloper(currentUser) ? 'developer' : 'home', isDeveloper(currentUser) ? '#developer' : '')}
                className="px-5 py-2.5 rounded-xl bg-[#09A3A3] text-white font-bold text-xs hover:bg-[#088F8F] cursor-pointer"
              >
                {isDeveloper(currentUser) ? 'Go to Developer Dashboard' : 'Return to Home'}
              </button>
            </div>
          )
        )}

        {currentPage === 'counselor' && (
          <AICounselorPage onBack={() => navigateTo('home', '')} currentUser={currentUser} />
        )}
      </main>

      {/* ---- Global Canonical Modal (when active outside ReportCardPage) ---- */}
      {globalModal && (
        <CanonicalModal
          isOpen={Boolean(globalModal)}
          onClose={() => setGlobalModal(null)}
          {...globalModal}
        />
      )}

      {/* ---- Success Toast ---- */}
      {successToast?.visible && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-[210] px-6 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-[fadeInDown_0.3s_ease-out] ${
            successToast.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
          style={{ fontFamily: "'Inter', sans-serif", minWidth: 280, maxWidth: 480 }}
          ref={(el) => {
            if (el && !el._toastTimerSet) {
              el._toastTimerSet = true;
              setTimeout(() => setSuccessToast(null), 4500);
            }
          }}
        >
          {successToast.isError ? (
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{successToast.message}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Footer */}
      {!isFullScreenPage && <Footer onStartTest={handleStartCareerTest} />}
      {!isFullScreenPage && currentPage === 'home' && <AICounselor currentUser={currentUser} onLoginRequest={() => navigateTo('signup', '#signup')} />}
    </div>
  );
}