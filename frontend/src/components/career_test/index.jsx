import React, { useRef } from 'react';
import PersonalityQuiz from './PersonalityQuiz';
import { useLanguage } from '../../translations/LanguageContext';
import { assessmentApi } from '../../api/assessmentApi';

export default function CareerTestModule({ userMetadata, appConfig, onCompleteTest, onExit }) {
  const { language } = useLanguage();
  const isSubmittingRef = useRef(false);

  // When test finishes, submit answers via central API client (including auth session cookies)
  const handleQuizFinish = async (answers) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const data = await assessmentApi.submitAnswers(answers, userMetadata || {}, language);
      if (onCompleteTest) {
        onCompleteTest(data);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      isSubmittingRef.current = false;
      // Fallback
      if (onCompleteTest) onCompleteTest({ error: true });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#CFEDED]">
      <PersonalityQuiz 
        appConfig={appConfig}
        onFinish={handleQuizFinish}
        onComplete={handleQuizFinish}
        onCompleteTest={handleQuizFinish}
        onExit={onExit}
        onBack={onExit}
      />
    </div>
  );
}