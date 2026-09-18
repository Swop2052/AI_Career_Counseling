import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, User, BookOpen, Sparkles, Camera } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';
import { AVATAR_LIST, normalizeAvatarKey, resolveAvatarUrl, DEFAULT_AVATAR_KEY, DEFAULT_AVATAR_URL } from '../utils/avatarUtils';
import { CLASS_YEAR_GROUPS } from '../utils/classYearUtils';

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
    enjoySubj: "Subjects you enjoy learning *",
    challSubj: "Subjects You Find Challenging *",
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
    enjoySubj: "आवडणारे विषय *",
    challSubj: "कठीण वाटणारे विषय *",
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
    enjoySubj: "पसंदीदा विषय *",
    challSubj: "कठिन लगने वाले विषय *",
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

export default function AssessmentOnboarding({ onComplete, onBackToHome, initialData, currentUser }) {
  const { language } = useLanguage();
  const tLoc = locT[language] || locT.en;
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Sanitize initial data against invalid placeholders and out-of-range values
  const sanitizeInitialName = () => {
    const raw = currentUser?.full_name || currentUser?.name || initialData?.fullName || '';
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (['guest', 'guest student', 'test student'].includes(trimmed.toLowerCase())) return '';
    return trimmed;
  };

  const sanitizeInitialAge = () => {
    const raw = currentUser?.age ?? initialData?.age ?? '';
    if (raw === '' || raw === null || raw === undefined) return '';
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 10 || num > 60) return '';
    return String(num);
  };

  const initialAvatarKey = normalizeAvatarKey(currentUser?.avatar || initialData?.avatar || currentUser?.profilePhoto || initialData?.profilePhoto) || DEFAULT_AVATAR_KEY;

  const [formData, setFormData] = useState({
    avatar: initialAvatarKey,
    profilePhoto: resolveAvatarUrl(initialAvatarKey) || initialData?.profilePhoto || currentUser?.profilePhoto || DEFAULT_AVATAR_URL,
    fullName: sanitizeInitialName(),
    age: sanitizeInitialAge(),
    classYear: currentUser?.class_year || currentUser?.education_level || initialData?.classYear || '',
    stream: currentUser?.stream || initialData?.stream || '',
    enjoySubjects: currentUser?.enjoy_subjects || initialData?.enjoySubjects || '',
    challengingSubjects: currentUser?.challenging_subjects || initialData?.challengingSubjects || '',
    interests: currentUser?.interests || initialData?.interests || '',
    hobbies: currentUser?.hobbies || initialData?.hobbies || '',
    strengths: currentUser?.strengths || initialData?.strengths || '',
    careerAspirations: currentUser?.career_aspirations || initialData?.careerAspirations || '',
    learningMode: initialData?.learningMode || 'Offline (Classroom/Lab)',
    budget: initialData?.budget || 'Moderate Budget',
    locationPref: initialData?.locationPref || 'India Wide',
    studyLocation: initialData?.studyLocation || '',
    collegeType: initialData?.collegeType || 'All Colleges (Govt & Private)'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAvatar = (avatarKey, avatarPath) => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarKey,
      profilePhoto: avatarPath
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    // 1. Full Name
    const name = (formData.fullName || '').trim();
    if (!name) {
      newErrors.fullName = 'Full Name is required.';
    } else if (name.length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters.';
    } else if (name.length > 100) {
      newErrors.fullName = 'Full Name cannot exceed 100 characters.';
    } else if (['guest', 'guest student', 'test student'].includes(name.toLowerCase())) {
      newErrors.fullName = 'Please enter your actual name instead of a placeholder.';
    }

    // 2. Age
    const rawAge = formData.age !== undefined && formData.age !== null ? String(formData.age).trim() : '';
    if (!rawAge) {
      newErrors.age = 'Age is required.';
    } else {
      const parsedAge = Number(rawAge);
      if (!Number.isInteger(parsedAge) || isNaN(parsedAge) || String(parsedAge) !== rawAge) {
        newErrors.age = 'Please enter a valid whole number for age.';
      } else if (parsedAge < 10 || parsedAge > 60) {
        newErrors.age = 'Age must be between 10 and 60 years.';
      }
    }

    // 3. Class/Year
    const classVal = (formData.classYear || '').trim();
    if (!classVal) {
      newErrors.classYear = 'Please select your Class or Academic Year.';
    }

    // 4. Subjects enjoyed
    const enjoy = (formData.enjoySubjects || '').trim();
    if (!enjoy) {
      newErrors.enjoySubjects = 'Please enter subjects you enjoy learning.';
    } else if (enjoy.length < 2) {
      newErrors.enjoySubjects = 'Subject name must be at least 2 characters.';
    }

    // 5. Subjects challenging
    const chall = (formData.challengingSubjects || '').trim();
    if (!chall) {
      newErrors.challengingSubjects = 'Please enter subjects you find challenging.';
    } else if (chall.length < 2) {
      newErrors.challengingSubjects = 'Subject name must be at least 2 characters.';
    }

    return newErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      const step1Errors = validateStep1();
      if (Object.keys(step1Errors).length > 0) {
        setErrors(step1Errors);
        const firstField = Object.keys(step1Errors)[0];
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      const canonicalAvatar = normalizeAvatarKey(formData.avatar || formData.profilePhoto) || DEFAULT_AVATAR_KEY;
      onComplete({
        ...formData,
        avatar: canonicalAvatar,
        profilePhoto: resolveAvatarUrl(canonicalAvatar) || formData.profilePhoto
      });
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

              {/* Profile Photo / Avatar Selection */}
              <div className="bg-[#F4FBFA] p-4 rounded-2xl border border-[#09A3A3]/20 mb-4">
                <label className="text-xs font-extrabold text-[#04211F] block mb-3">Profile Photo / Avatar</label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current Photo Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-[#09A3A3] overflow-hidden flex items-center justify-center shadow-inner">
                      {formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#E8B04B] rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  
                  {/* Avatar Options */}
                  <div className="flex-1 w-full">
                    <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-wide">Or choose an avatar:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_LIST.map((item) => {
                        const isSelected = formData.avatar === item.key || formData.profilePhoto === item.path;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => selectAvatar(item.key, item.path)}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 cursor-pointer ${
                              isSelected
                                ? 'border-[#09A3A3] ring-2 ring-[#09A3A3]/40 shadow-md scale-110'
                                : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img src={item.path} alt={item.key} className="w-full h-full object-cover bg-white" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-medium transition-all ${
                      errors.fullName
                        ? 'bg-rose-50/50 border border-rose-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-400 text-[#04211F]'
                        : 'bg-[#F4FBFA] border border-[#09A3A3]/20 focus:outline-none focus:border-[#09A3A3] text-xs font-medium'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.fullName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.age}</label>
                  <input 
                    type="number" 
                    name="age"
                    min="10"
                    max="60"
                    step="1"
                    value={formData.age} 
                    onChange={handleChange}
                    placeholder={tLoc.placeholders.age}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-medium transition-all ${
                      errors.age
                        ? 'bg-rose-50/50 border border-rose-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-400 text-[#04211F]'
                        : 'bg-[#F4FBFA] border border-[#09A3A3]/20 focus:outline-none focus:border-[#09A3A3] text-xs font-medium'
                    }`}
                  />
                  {errors.age && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.age}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">{tLoc.classYear}</label>
                  <select 
                    name="classYear"
                    value={formData.classYear} 
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                      errors.classYear
                        ? 'bg-rose-50/50 border border-rose-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-400 text-[#04211F]'
                        : 'bg-[#F4FBFA] border border-[#09A3A3]/20 focus:outline-none focus:border-[#09A3A3] text-xs font-medium'
                    }`}
                  >
                    <option value="">{tLoc.selectClass}</option>
                    {CLASS_YEAR_GROUPS.map((grp) => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.classYear && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.classYear}
                    </p>
                  )}
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
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-medium transition-all ${
                    errors.enjoySubjects
                      ? 'bg-rose-50/50 border border-rose-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-400 text-[#04211F]'
                      : 'bg-[#F4FBFA] border border-[#09A3A3]/20 focus:outline-none focus:border-[#09A3A3] text-xs font-medium'
                  }`}
                />
                {errors.enjoySubjects && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.enjoySubjects}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">{tLoc.challSubj}</label>
                <input 
                  type="text" 
                  name="challengingSubjects"
                  value={formData.challengingSubjects} 
                  onChange={handleChange}
                  placeholder={tLoc.placeholders.challSubj}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-medium transition-all ${
                    errors.challengingSubjects
                      ? 'bg-rose-50/50 border border-rose-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-400 text-[#04211F]'
                      : 'bg-[#F4FBFA] border border-[#09A3A3]/20 focus:outline-none focus:border-[#09A3A3] text-xs font-medium'
                  }`}
                />
                {errors.challengingSubjects && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.challengingSubjects}
                  </p>
                )}
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