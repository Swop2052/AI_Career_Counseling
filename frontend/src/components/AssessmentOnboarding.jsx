import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, User, BookOpen, Sparkles } from 'lucide-react';

export default function AssessmentOnboarding({ onComplete, onBackToHome }) {
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
                SkillSense Assessment Setup
              </span>
            </div>
            <span className="text-xs font-black text-[#09A3A3] bg-[#EBF9F7] px-3 py-1 rounded-full border border-[#09A3A3]/20">
              Step {step} of 3
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
          Tell us about yourself
        </h2>
        <p className="text-xs text-gray-500 text-center mb-8 font-medium">
          Help our AI tailor the precise career roadmap for your profile.
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
                <User className="w-4 h-4" /> Basic Details & Learning Profile
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName} 
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">Age *</label>
                  <input 
                    type="number" 
                    name="age"
                    value={formData.age} 
                    onChange={handleChange}
                    placeholder="Enter your age"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">Class/Year *</label>
                  <select 
                    name="classYear"
                    value={formData.classYear} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all cursor-pointer"
                  >
                    <option value="">Select your class</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 12">Class 12</option>
                    <option value="1st Year College">1st Year College</option>
                    <option value="2nd Year College">2nd Year College</option>
                    <option value="3rd Year College">3rd Year College</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#04211F]">Education Stream/Field</label>
                  <input 
                    type="text" 
                    name="stream"
                    value={formData.stream} 
                    onChange={handleChange}
                    placeholder="e.g., Science, Commerce, Arts"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-[#04211F]">Subjects you enjoy learning</label>
                <input 
                  type="text" 
                  name="enjoySubjects"
                  value={formData.enjoySubjects} 
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, Physics, English, History"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Subjects You Find Challenging</label>
                <input 
                  type="text" 
                  name="challengingSubjects"
                  value={formData.challengingSubjects} 
                  onChange={handleChange}
                  placeholder="e.g., Chemistry, Statistics, Economics"
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
                <Sparkles className="w-4 h-4" /> What inspires you outside academics?
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Your Interests</label>
                <input 
                  type="text" 
                  name="interests"
                  value={formData.interests} 
                  onChange={handleChange}
                  placeholder="e.g., Technology, Research, Art, Sports, Social Work"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Your Hobbies</label>
                <input 
                  type="text" 
                  name="hobbies"
                  value={formData.hobbies} 
                  onChange={handleChange}
                  placeholder="e.g., Reading, Gaming, Painting, Coding, Gardening"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Your Natural Strengths</label>
                <input 
                  type="text" 
                  name="strengths"
                  value={formData.strengths} 
                  onChange={handleChange}
                  placeholder="e.g., Problem-solving, Communication, Leadership"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4FBFA] border border-[#09A3A3]/20 text-xs font-medium focus:outline-none focus:border-[#09A3A3] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Career Aspirations (if any)</label>
                <input 
                  type="text" 
                  name="careerAspirations"
                  value={formData.careerAspirations} 
                  onChange={handleChange}
                  placeholder="e.g., Engineer, Doctor, Scientist, Entrepreneur"
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
                <BookOpen className="w-4 h-4" /> Career Ambitions & Preferences
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#04211F]">Preferred Learning Mode</label>
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
                <label className="text-xs font-extrabold text-[#04211F]">Budget Preference</label>
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
                <label className="text-xs font-extrabold text-[#04211F]">Location Preference</label>
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
                <label className="text-xs font-extrabold text-[#04211F]">Preferred College Type/Range</label>
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
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-[#04302E] to-[#09A3A3] text-white text-xs font-extrabold shadow-lg shadow-[#09A3A3]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{step === 3 ? 'Continue to Career Test' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}