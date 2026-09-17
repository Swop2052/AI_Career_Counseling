import { Sparkles, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
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

// Separate Legal Pages
import TermsConditions from './components/auth/TermsConditions';
import PrivacyPolicy from './components/auth/PrivacyPolicy';
import ConsentForm from './components/auth/ConsentForm';
import AcceptInvitation from './components/auth/AcceptInvitation';
import { isSuperAdmin, isDeveloper, canAccessDeveloperConsole } from './utils/roleUtils';

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
  const [zeroCreditModal, setZeroCreditModal] = useState(null); // { attemptId }
  const [unlockConfirmModal, setUnlockConfirmModal] = useState(null); // { attemptId, balance, title, description }
  const [successToast, setSuccessToast] = useState(null); // { message, visible, isError }
  const setPostSignupZeroCreditModal = setZeroCreditModal;

  const [onboardingData, setOnboardingData] = useState(() => {
    try {
      const savedData = localStorage.getItem('skillsense_onboarding');
      return savedData ? JSON.parse(savedData) : null;
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
        if (isSuperAdmin(activeUser)) {
          // Super Admins should always land on the full Super Admin Console with User Management
          setCurrentPage('admin');
          window.history.replaceState(null, '', '#admin');
        } else if (canAccessDeveloperConsole(activeUser)) {
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
      if (currentUser && isSuperAdmin(currentUser)) {
        navigateTo('admin', '#admin');
      } else if (currentUser && !canAccessDeveloperConsole(currentUser)) {
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
      window.history.pushState(null, '', hash);
    } else {
      window.history.pushState(null, '', window.location.pathname);
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
        flowState: 'pending_assessment_locked',
        completedAt: Date.now(),
        dismissed: false
      };
      sessionStorage.setItem('skillsense_active_assessment_flow', JSON.stringify(flow));
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
            setUnlockConfirmModal({
              attemptId: attemptId,
              balance: userBalance,
              title: "Unlock with 1 Credit",
              description: "Spend 1 credit from your available balance to reveal your personalized career roadmap and detailed trait breakdown."
            });
          } else {
            setZeroCreditModal({
              attemptId: attemptId
            });
          }
        })
        .catch(() => {
          const fallbackBalance = currentUser?.balance ?? 0;
          if (fallbackBalance >= 1) {
            setUnlockConfirmModal({
              attemptId: attemptId,
              balance: fallbackBalance,
              title: "Unlock with 1 Credit",
              description: "Spend 1 credit from your available balance to reveal your personalized career roadmap and detailed trait breakdown."
            });
          } else {
            setZeroCreditModal({ attemptId: attemptId });
          }
        });
    }
  };

  const handleSignupSuccess = (userData, claimedAttemptId) => {
    const user = userData || { name: tempStudentName || onboardingData?.fullName || 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    const activeFlow = getActiveAssessmentFlow();
    const activeAttempt = claimedAttemptId || (activeFlow ? activeFlow.attemptId : null);

    authApi.getMe().then(async (res) => {
      const liveUser = res?.user || user;
      if (res?.user) {
        setCurrentUser(liveUser);
        localStorage.setItem('skillsense_user', JSON.stringify(liveUser));
      }

      // If no valid recent pending assessment flow from this session:
      if (!activeFlow || !activeAttempt || activeFlow.dismissed) {
        navigateTo('profile', '#profile');
        return;
      }

      // Verify assessment ownership and status with backend
      try {
        const statusRes = await assessmentApi.getStatus(activeAttempt);
        if (!statusRes?.exists || !statusRes?.is_owner) {
          navigateTo('profile', '#profile');
          return;
        }

        if (statusRes.is_unlocked) {
          setIsPurchased(true);
          updateAssessmentFlow({ flowState: 'unlocked' });
          navigateTo('report', '#report');
          return;
        }

        const userBalance = liveUser?.balance ?? 0;
        if (userBalance >= 1) {
          setUnlockConfirmModal({
            attemptId: activeAttempt,
            balance: userBalance,
            title: "Unlock with 1 Credit",
            description: "You have credits available! Spend 1 credit from your balance to reveal your full career roadmap."
          });
          navigateTo('report', '#report');
        } else {
          setZeroCreditModal({ attemptId: activeAttempt });
          navigateTo('report', '#report');
        }
      } catch (e) {
        console.warn('Could not verify assessment status on signup:', e);
        navigateTo('profile', '#profile');
      }
    }).catch(() => {
      navigateTo('profile', '#profile');
    });
  };

  const handleLoginSuccess = (userData, claimedAttemptId) => {
    const user = userData || { name: 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    const activeFlow = getActiveAssessmentFlow();
    const activeAttempt = claimedAttemptId || (activeFlow ? activeFlow.attemptId : null);

    authApi.getMe().then(async (res) => {
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
      if (!activeFlow || !activeAttempt || activeFlow.dismissed) {
        goToNormalDestination();
        return;
      }

      // Verify assessment ownership and status with backend
      try {
        const statusRes = await assessmentApi.getStatus(activeAttempt);
        if (!statusRes?.exists || !statusRes?.is_owner) {
          goToNormalDestination();
          return;
        }

        if (statusRes.is_unlocked) {
          setIsPurchased(true);
          updateAssessmentFlow({ flowState: 'unlocked' });
          navigateTo('report', '#report');
          return;
        }

        const userBalance = liveUser?.balance ?? 0;
        if (userBalance >= 1) {
          setUnlockConfirmModal({
            attemptId: activeAttempt,
            balance: userBalance,
            title: "Unlock with 1 Credit",
            description: "You have credits available! Spend 1 credit from your balance to reveal your full career roadmap."
          });
          navigateTo('report', '#report');
        } else {
          setZeroCreditModal({ attemptId: activeAttempt });
          navigateTo('report', '#report');
        }
      } catch (e) {
        console.warn('Could not verify assessment status on login:', e);
        goToNormalDestination();
      }
    }).catch(() => {
      navigateTo('profile', '#profile');
    });
  };

  const handlePurchaseSuccess = async (purchaseRes) => {
    let freshBalance = currentUser?.balance;
    try {
      const meRes = await authApi.getMe();
      if (meRes && meRes.user) {
        setCurrentUser(meRes.user);
        freshBalance = meRes.user.balance;
        localStorage.setItem('skillsense_user', JSON.stringify(meRes.user));
      }
    } catch (e) {
      console.warn('[handlePurchaseSuccess] Failed to refresh session:', e);
    }

    const activeFlow = getActiveAssessmentFlow();
    const returnAttemptId = activeFlow?.attemptId ||
                           localStorage.getItem('skillsense_return_to_unlock') ||
                           savedAttemptId ||
                           reportData?.attempt_id;

    if (returnAttemptId) {
      try {
        const statusRes = await assessmentApi.getStatus(returnAttemptId);
        if (statusRes?.exists && !statusRes.is_unlocked) {
          updateAssessmentFlow({ attemptId: returnAttemptId, flowState: 'ready_to_unlock', dismissed: false });
          // Return to the unlock prompt for that same assessment
          // DO NOT automatically spend the newly acquired credit!
          setUnlockConfirmModal({
            attemptId: returnAttemptId,
            balance: freshBalance ?? 1,
            title: "Unlock with 1 Credit",
            description: "Your credit is available! Spend 1 credit from your balance to reveal your personalized career roadmap now."
          });
          navigateTo('report', '#report');
          return;
        } else if (statusRes?.is_unlocked) {
          setIsPurchased(true);
          updateAssessmentFlow({ flowState: 'unlocked' });
          navigateTo('report', '#report');
          return;
        }
      } catch (err) {
        console.warn('Failed to verify return attempt status:', err);
      }
    }

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
      updateAssessmentFlow({ attemptId: attemptId, flowState: 'unlocked', dismissed: false });
      localStorage.removeItem('skillsense_return_to_unlock');

      // Refresh authoritative user session & balance
      const meRes = await authApi.getMe();
      if (meRes?.user) {
        setCurrentUser(meRes.user);
        localStorage.setItem('skillsense_user', JSON.stringify(meRes.user));
      }
      setUnlockConfirmModal(null);
      setZeroCreditModal(null);
      setSuccessToast({ message: 'Career roadmap unlocked successfully!', visible: true });
      navigateTo('report', '#report');
    } catch (err) {
      console.error('[handleUnlock] Unlock failed:', err);
      const isInsufficient = err?.status === 402 || err?.data?.insufficient_credits;
      if (isInsufficient) {
        updateAssessmentFlow({ attemptId: attemptId, flowState: 'awaiting_credit_purchase' });
        localStorage.setItem('skillsense_return_to_unlock', attemptId);
        setUnlockConfirmModal(null);
        setZeroCreditModal({ attemptId });
      } else {
        const errorMsg = err?.message || err?.data?.error || 'Failed to unlock assessment report. Your credit is preserved.';
        setSuccessToast({ message: errorMsg, visible: true, isError: true });
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
    setZeroCreditModal(null);
    setUnlockConfirmModal(null);
    navigateTo('home', '');
  };

  const activeReportUser = currentUser || (tempStudentName || onboardingData?.fullName ? { name: tempStudentName || onboardingData?.fullName, grade: onboardingData?.classYear } : null);
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
            onCreateAccount={() => navigateTo('signup', '#signup')}
            onGoToPricing={() => {
              const attemptId = reportData?.attempt_id ||
                                getActiveAssessmentFlow()?.attemptId;
              if (attemptId) {
                updateAssessmentFlow({ attemptId, flowState: 'awaiting_credit_purchase' });
                localStorage.setItem('skillsense_return_to_unlock', attemptId);
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

      {/* ---- Zero-Credit Modal ---- */}
      {zeroCreditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border border-gray-100 z-10 text-center animate-[scaleUp_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#09A3A3] to-[#04302E] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-[#09A3A3] bg-teal-50 px-3 py-1 rounded-full">
              Assessment Saved
            </span>

            <h2 className="text-xl font-bold text-[#04211F] mt-3 mb-2">
              Credits Required to Unlock
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Credits are required to unlock this career report. Buy 1 credit to reveal your personalized career roadmap and detailed trait breakdown.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const attId = zeroCreditModal.attemptId || getActiveAssessmentFlow()?.attemptId;
                  if (attId) {
                    updateAssessmentFlow({ attemptId: attId, flowState: 'awaiting_credit_purchase' });
                    localStorage.setItem('skillsense_return_to_unlock', attId);
                  }
                  setZeroCreditModal(null);
                  navigateTo('pricing', '#pricing');
                }}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white text-sm font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const attId = zeroCreditModal.attemptId || getActiveAssessmentFlow()?.attemptId;
                  if (attId) {
                    updateAssessmentFlow({ attemptId: attId, dismissed: true, flowState: 'dismissed' });
                  }
                  setZeroCreditModal(null);
                  navigateTo('profile', '#profile');
                }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-4">
              Your assessment is securely saved. You can unlock it anytime from My Profile.
            </p>
          </div>
        </div>
      )}

      {/* ---- Unlock Confirmation Modal ---- */}
      {unlockConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#04211F]/50 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border border-gray-100 z-10 text-center animate-[scaleUp_0.2s_ease-out]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-bold text-[#04211F] mb-2">
              {unlockConfirmModal.title || "Unlock with 1 Credit"}
            </h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              {unlockConfirmModal.description || "Spend 1 credit from your available balance to reveal your complete career roadmap now."}
            </p>

            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mb-5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span>Available Balance:</span>
              <span className="font-bold">{currentUser?.balance ?? unlockConfirmModal.balance ?? 0} {(currentUser?.balance ?? unlockConfirmModal.balance ?? 0) === 1 ? 'Credit' : 'Credits'}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isUnlocking}
                onClick={async () => {
                  const attId = unlockConfirmModal.attemptId || getActiveAssessmentFlow()?.attemptId;
                  if (!attId) {
                    setUnlockConfirmModal(null);
                    return;
                  }
                  await handleUnlock(attId);
                }}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white text-sm font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnlocking ? (
                  <span>Unlocking...</span>
                ) : (
                  <>
                    <span>Unlock with 1 Credit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isUnlocking}
                onClick={() => {
                  const attId = unlockConfirmModal.attemptId || getActiveAssessmentFlow()?.attemptId;
                  if (attId) {
                    updateAssessmentFlow({ attemptId: attId, dismissed: true, flowState: 'dismissed' });
                  }
                  setUnlockConfirmModal(null);
                  navigateTo('profile', '#profile');
                }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-colors cursor-pointer disabled:opacity-50"
              >
                Not Now
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-4">
              1 credit will be used. Your full roadmap will be permanently saved in My Profile.
            </p>
          </div>
        </div>
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