import React from 'react';
import PersonalityQuiz from './PersonalityQuiz';

export default function CareerTestModule({ userMetadata, appConfig, onCompleteTest, onExit }) {
  // जेव्हा टेस्ट पूर्ण होईल, तेव्हा रिझल्ट API ला पाठवेल आणि मग App.jsx ला देईल
  const handleQuizFinish = async (answers) => {
    try {
      const response = await fetch('/api/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answers,
          student_info: userMetadata || {}
        })
      });
      const data = await response.json();
      if (onCompleteTest) {
        onCompleteTest(data);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
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
        onExit={onExit}
        onBack={onExit}
      />
    </div>
  );
}