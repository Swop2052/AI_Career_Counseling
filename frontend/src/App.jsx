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

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isPurchased, setIsPurchased] = useState(false);
  const [tempStudentName, setTempStudentName] = useState('');

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
  }, []);

  // Sync route and reset scroll on navigation
  useEffect(() => {
    const syncPageWithHash = () => {
      const hash = window.location.hash;
      if (hash === '#onboarding') setCurrentPage('onboarding');
      else if (hash === '#test') setCurrentPage('test');
      else if (hash === '#report') setCurrentPage('report');
      else if (hash === '#pricing') setCurrentPage('pricing');
      else if (hash === '#login') setCurrentPage('login');
      else if (hash === '#signup') setCurrentPage('signup');
      else if (hash === '#terms') setCurrentPage('terms');
      else if (hash === '#privacy') setCurrentPage('privacy');
      else if (hash === '#profile') setCurrentPage('profile');
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
  }, []);

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
    navigateTo('onboarding', '#onboarding');
  };

  const handleOnboardingComplete = (formData) => {
    setOnboardingData(formData);
    localStorage.setItem('skillsense_onboarding', JSON.stringify(formData));
    if (formData?.fullName) {
      setTempStudentName(formData.fullName);
    }
    navigateTo('test', '#test');
  };

  const handleCompleteTest = (data) => {
    if (data && data.student_info?.fullName) {
      setTempStudentName(data.student_info.fullName);
    }
    setReportData(data);
    localStorage.setItem('skillsense_report', JSON.stringify(data));

    // Enforce authentication before showing report
    if (!currentUser) {
      localStorage.setItem('skillsense_pending_report', 'true');
      navigateTo('signup', '#signup');
    } else {
      navigateTo('report', '#report');
    }
  };

  const handleSignupSuccess = (userData) => {
    const user = userData || { name: tempStudentName || onboardingData?.fullName || 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    // If user just completed the test, send them directly to report
    if (localStorage.getItem('skillsense_pending_report')) {
      localStorage.removeItem('skillsense_pending_report');
      navigateTo('report', '#report');
    } else {
      navigateTo('pricing', '#pricing');
    }
  };

  const handleLoginSuccess = (userData) => {
    const user = userData || { name: 'User', email: 'user@skillsense.ai', initials: 'U' };
    setCurrentUser(user);
    localStorage.setItem('skillsense_user', JSON.stringify(user));

    // If user just completed the test as a guest and logged in, send them directly to report
    if (localStorage.getItem('skillsense_pending_report')) {
      localStorage.removeItem('skillsense_pending_report');
      navigateTo('report', '#report');
    } else {
      navigateTo('home', '');
    }
  };

  const handlePurchaseSuccess = () => {
    setIsPurchased(true);
    navigateTo('report', '#report');
  };

  const handleLogout = () => {
    localStorage.removeItem('skillsense_user');
    localStorage.removeItem('skillsense_onboarding');
    setCurrentUser(null);
    setIsPurchased(false);
    setTempStudentName('');
    setOnboardingData(null);
    navigateTo('home', '');
  };

  const activeReportUser = currentUser || (tempStudentName || onboardingData?.fullName ? { name: tempStudentName || onboardingData?.fullName, grade: onboardingData?.classYear } : null);
  const isFullScreenPage = ['login', 'signup', 'test', 'pricing', 'terms', 'privacy', 'onboarding'].includes(currentPage);

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
          <ReportCardPage
            user={activeReportUser}
            reportData={reportData}
            isPurchased={Boolean(currentUser) || isPurchased}
            onCreateAccount={() => navigateTo('signup', '#signup')}
            onGoToPricing={() => navigateTo('pricing', '#pricing')}
          />
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
            onPurchaseSuccess={handlePurchaseSuccess}
            onBack={() => navigateTo('report', '#report')}
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
            onViewReport={() => navigateTo('report', '#report')}
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

        {currentPage === 'counselor' && (
          <AICounselorPage onBack={() => navigateTo('home', '')} currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      {!isFullScreenPage && <Footer onStartTest={handleStartCareerTest} />}
      {!isFullScreenPage && currentPage === 'home' && <AICounselor currentUser={currentUser} onLoginRequest={() => navigateTo('signup', '#signup')} />}
    </div>
  );
}