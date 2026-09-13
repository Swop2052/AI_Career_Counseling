import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, User, BookOpen, Sparkles } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';

const locT = {
  en: {
    setupTitle: "SkillSense Assessment Setup",
    stepOf: "Step {step} of 3",
    heading: "Tell us about yourself",
    subheading: "Help our AI tailor the precise career roadmap for your profile.",
    basicDetails: "Basic Details & Learning Profile",
    fullName: "Full Name *",
    age: "Age *",
    classYear: "Class/Year *",
    selectClass: "Select your class",
    stream: "Education Stream/Field",
    enjoySubj: "Subjects you enjoy learning",
    challSubj: "Subjects You Find Challenging",
    inspiresOutside: "What inspires you outside academics?",
    interests: "Your Interests",
    hobbies: "Your Hobbies",
    strengths: "Your Natural Strengths",
    careerAsp: "Career Aspirations (if any)",
    careerAmb: "Career Ambitions & Preferences",
    learnMode: "Preferred Learning Mode",
    budget: "Budget Preference",
    locPref: "Location Preference",
    collegeType: "Preferred College Type/Range",
    backBtn: "Back",
    nextBtn: "Next Step",
    continueBtn: "Continue to Career Test",
    placeholders: {
      fullName: "Enter your full name",
      age: "Enter your age",
      stream: "e.g., Science, Commerce, Arts",
      enjoySubj: "e.g., Mathematics, Physics, English, History",
      challSubj: "e.g., Chemistry, Statistics, Economics",
      interests: "e.g., Technology, Research, Art, Sports, Social Work",
      hobbies: "e.g., Reading, Gaming, Painting, Coding, Gardening",
      strengths: "e.g., Problem-solving, Communication, Leadership",
      careerAsp: "e.g., Engineer, Doctor, Scientist, Entrepreneur"
    }
  },
  mr: {
    setupTitle: "स्किलसेन्स मूल्यांकन सेटअप",
    stepOf: "3 पैकी स्टेप {step}",
    heading: "स्वतःबद्दल सांगा",
    subheading: "आमच्या AI ला तुमच्या प्रोफाईलनुसार योग्य करिअर रोडमॅप तयार करण्यात मदत करा.",
    basicDetails: "प्राथमिक माहिती आणि शैक्षणिक प्रोफाईल",
    fullName: "पूर्ण नाव *",
    age: "वय *",
    classYear: "इयत्ता/वर्ष *",
    selectClass: "तुमची इयत्ता निवडा",
    stream: "शिक्षण शाखा/क्षेत्र",
    enjoySubj: "आवडणारे विषय",
    challSubj: "कठीण वाटणारे विषय",
    inspiresOutside: "अभ्यासाव्यतिरिक्त तुम्हाला कशाची आवड आहे?",
    interests: "तुमची आवड",
    hobbies: "तुमचे छंद",
    strengths: "तुमचे नैसर्गिक गुण",
    careerAsp: "करिअरची स्वप्ने (असल्यास)",
    careerAmb: "करिअरची उद्दिष्टे आणि प्राधान्ये",
    learnMode: "शिक्षणाचे माध्यम",
    budget: "बजेट",
    locPref: "ठिकाण प्राधान्य",
    collegeType: "कॉलेजचा प्रकार",
    backBtn: "मागे",
    nextBtn: "पुढील स्टेप",
    continueBtn: "करिअर टेस्ट सुरू करा",
    placeholders: {
      fullName: "तुमचे पूर्ण नाव लिहा",
      age: "तुमचे वय लिहा",
      stream: "उदा., विज्ञान, वाणिज्य, कला",
      enjoySubj: "उदा., गणित, भौतिकशास्त्र, इंग्रजी, इतिहास",
      challSubj: "उदा., रसायनशास्त्र, सांख्यिकी, अर्थशास्त्र",
      interests: "उदा., तंत्रज्ञान, संशोधन, कला, खेळ, समाजकार्य",
      hobbies: "उदा., वाचन, गेमिंग, चित्रकला, कोडिंग, बागकाम",
      strengths: "उदा., समस्या सोडवणे, संवाद, नेतृत्व",
      careerAsp: "उदा., अभियंता, डॉक्टर, शास्त्रज्ञ, उद्योजक"
    }
  },
  hi: {
    setupTitle: "स्किलसेंस मूल्यांकन सेटअप",
    stepOf: "3 में से स्टेप {step}",
    heading: "अपने बारे में बताएं",
    subheading: "हमारे AI को आपकी प्रोफ़ाइल के अनुसार सटीक करियर रोडमैप तैयार करने में मदद करें।",
    basicDetails: "मूल जानकारी और शैक्षिक प्रोफ़ाइल",
    fullName: "पूरा नाम *",
    age: "उम्र *",
    classYear: "कक्षा/वर्ष *",
    selectClass: "अपनी कक्षा चुनें",
    stream: "शिक्षा स्ट्रीम/क्षेत्र",
    enjoySubj: "पसंदीदा विषय",
    challSubj: "कठिन लगने वाले विषय",
    inspiresOutside: "पढ़ाई के अलावा आपको क्या प्रेरित करता है?",
    interests: "आपकी रुचियां",
    hobbies: "आपके शौक",
    strengths: "आपके प्राकृतिक गुण",
    careerAsp: "करियर की आकांक्षाएं (यदि कोई हों)",
    careerAmb: "करियर लक्ष्य और प्राथमिकताएं",
    learnMode: "सीखने का माध्यम",
    budget: "बजट",
    locPref: "स्थान प्राथमिकता",
    collegeType: "कॉलेज का प्रकार",
    backBtn: "पीछे",
    nextBtn: "अगला स्टेप",
    continueBtn: "करियर टेस्ट शुरू करें",
    placeholders: {
      fullName: "अपना पूरा नाम दर्ज करें",
      age: "अपनी उम्र दर्ज करें",
      stream: "उदा., विज्ञान, वाणिज्य, कला",
      enjoySubj: "उदा., गणित, भौतिकी, अंग्रेजी, इतिहास",
      challSubj: "उदा., रसायन विज्ञान, सांख्यिकी, अर्थशास्त्र",
      interests: "उदा., प्रौद्योगिकी, अनुसंधान, कला, खेल, सामाजिक कार्य",
      hobbies: "उदा., पढ़ना, गेमिंग, पेंटिंग, कोडिंग, बागवानी",
      strengths: "उदा., समस्या समाधान, संचार, नेतृत्व",
      careerAsp: "उदा., इंजीनियर, डॉक्टर, वैज्ञानिक, उद्यमी"
    }
  }
};

export default function AssessmentOnboarding({ onComplete, onBackToHome }) {
  const { language } = useLanguage();
  const tLoc = locT[language] || locT.en;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    classYear: '',
    stream: '',
    enjoySubjects: '',
    challengingSubjects: '',
    interests: '',
    hobbies: '',
    strengths: '',
    careerAspirations: '',
    learningMode: 'Offline (Classroom/Lab)',
    budget: 'Moderate Budget',
    locationPref: 'India Wide',
    studyLocation: '',
    collegeType: 'All Colleges (Govt & Private)'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete(formData);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    else onBackToHome();
  };

  return (
    <div 
      className="min-h-screen w-full h-50 bg-[#CFEDED] py-8 px-4 flex items-center justify-center relative selection:bg-[#09A3A3] selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* Background Glow Effects */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#09A3A3]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#E8B04B]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-[#FAFDFC] rounded-[32px] shadow-[0_16px_48px_rgba(4,48,46,0.08)] border border-white p-6 sm:p-10 relative overflow-hidden"
      >
        
        {/* Progress Bar Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#09A3A3]/15 flex items-center justify-center text-[#09A3A3]">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#04302E]">
                {tLoc.setupTitle}
              </span>
            </div>
            <span className="text-xs font-black text-[#09A3A3] bg-[#EBF9F7] px-3 py-1 rounded-full border border-[#09A3A3]/20">
              {tLoc.stepOf.replace('{step}', step)}
            </span>
          </div>

          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#04302E] to-[#09A3A3]"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#04211F] tracking-tight text-center mb-1">
          {tLoc.heading}
        </h2>
        <p className="text-xs text-gray-500 text-center mb-8 font-medium">
          {tLoc.subheading}
        </p>

        {/* STEP 1 */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 text-xs font-black text-[#09A3A3] uppercase tracking-wider mb-2">
                <User className="w-4 h-4" /> {tLoc.basicDetails}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.fullName}</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName} 
                    onChange={handleChange}
                    placeholder={tLoc.placeholders.fullName}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.age}</label>
                  <input 
                    type="number" 
                    name="age"
                    value={formData.age} 
                    onChange={handleChange}
                    placeholder={tLoc.placeholders.age}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.classYear}</label>
                  <select 
                    name="classYear"
                    value={formData.classYear} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                  >
                    <option value="">{tLoc.selectClass}</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 12">Class 12</option>
                    <option value="1st Year College">1st Year College</option>
                    <option value="2nd Year College">2nd Year College</option>
                    <option value="3rd Year College">3rd Year College</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.stream}</label>
                  <input 
                    type="text" 
                    name="stream"
                    value={formData.stream} 
                    onChange={handleChange}
                    placeholder={tLoc.placeholders.stream}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.enjoySubj}</label>
                <input 
                  type="text" 
                  name="enjoySubjects"
                  value={formData.enjoySubjects} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.enjoySubj}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.challSubj}</label>
                <input 
                  type="text" 
                  name="challengingSubjects"
                  value={formData.challengingSubjects} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.challSubj}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-black text-[#09A3A3] uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> {tLoc.inspiresOutside}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.interests}</label>
                <input 
                  type="text" 
                  name="interests"
                  value={formData.interests} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.interests}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.hobbies}</label>
                <input 
                  type="text" 
                  name="hobbies"
                  value={formData.hobbies} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.hobbies}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.strengths}</label>
                <input 
                  type="text" 
                  name="strengths"
                  value={formData.strengths} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.strengths}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.careerAsp}</label>
                <input 
                  type="text" 
                  name="careerAspirations"
                  value={formData.careerAspirations} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.careerAsp}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-black text-[#09A3A3] uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4" /> {tLoc.careerAmb}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.learnMode}</label>
                <select 
                  name="learningMode"
                  value={formData.learningMode} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                >
                  <option value="Offline (Classroom/Lab)">Offline (Classroom/Lab)</option>
                  <option value="Online / Hybrid">Online / Hybrid</option>
                  <option value="Self-paced">Self-paced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.budget}</label>
                <select 
                  name="budget"
                  value={formData.budget} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                >
                  <option value="Moderate Budget">Moderate Budget</option>
                  <option value="Affordable / Low Budget">Affordable / Low Budget</option>
                  <option value="Premium / High Investment">Premium / High Investment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.locPref}</label>
                <select 
                  name="locationPref"
                  value={formData.locationPref} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                >
                  <option value="India Wide">India Wide</option>
                  <option value="State Specific (Maharashtra)">State Specific (Maharashtra)</option>
                  <option value="International">International</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.collegeType}</label>
                <select 
                  name="collegeType"
                  value={formData.collegeType} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                >
                  <option value="All Colleges (Govt & Private)">All Colleges (Govt & Private)</option>
                  <option value="Government Only">Government Only</option>
                  <option value="Top Private Institutions">Top Private Institutions</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            className="px-6 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tLoc.backBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-[#04302E] to-[#09A3A3] text-white text-xs font-extrabold shadow-lg shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{step === 3 ? tLoc.continueBtn : tLoc.nextBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}