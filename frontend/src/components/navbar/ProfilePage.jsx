import React, { useState, useRef } from 'react';
import {
  CreditCard, Lock, CheckCircle2, Check, Award, BookOpen, Compass,
  Sparkles, TrendingUp, User, FileText, Bot, Edit3, X, Mail, Phone,
  Calendar, MapPin, GraduationCap, Heart, Briefcase, Pencil, MessageCircle, History as HistoryIcon, Clock
} from 'lucide-react';


import profileVideo from '../../assets/profile-video.mp4';

const TONE_STYLES = {
  teal: { bg: '#D8F2EC', text: '#0B8F86', border: '#A9E5D9' },
  blue: { bg: '#DCE8FC', text: '#2E4F9E', border: '#B9D0F7' },
  gold: { bg: '#FCE9C6', text: '#8A5E10', border: '#F2D28A' },
  purple: { bg: '#EBDBFB', text: '#6633A3', border: '#D6BAF5' },
};

const historyLog = [
  { label: 'Completed Personality Test', detail: 'Found your RIASEC traits', when: '2 days ago', icon: CheckCircle2 },
  { label: 'Explored Software Engineering', detail: 'Viewed the career roadmap', when: '1 day ago', icon: Compass },
  { label: 'Chatted with VERA', detail: 'Asked about college prep', when: '12 hours ago', icon: MessageCircle }
];

function TagGroup({ icon: Icon, title, items, tone }) {
  const t = TONE_STYLES[tone];
  const list = (items || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: t.text }} />
        <span className="text-xs font-semibold text-[#5B7975]">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((item, i) => (
          <span
            key={i}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={{ background: t.bg, color: t.text, borderColor: t.border }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage({ user, onboardingData, isPurchased, onBack, onSave, onGoToPricing, onUnlockReport, onViewReport }) {
  const fileInputRef = useRef(null);
  const [avatarImage, setAvatarImage] = useState(user?.avatar || null);
  const [credits, setCredits] = useState(1);
  const [workshopCode, setWorkshopCode] = useState('');
  const [codeRedeemed, setCodeRedeemed] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || onboardingData?.fullName || 'Swapnil',
    email: user?.email || 'swapnil@skillsense.ai',
    phone: user?.phone || '+91 98765 43210',
    age: onboardingData?.age || '23',
    educationStage: user?.grade || onboardingData?.classYear || '3rd Year College',
    stream: onboardingData?.stream || 'Science / Tech',
    enjoySubjects: onboardingData?.enjoySubjects || 'Mathematics, AI',
    interests: onboardingData?.interests || 'Technology, Research',
    hobbies: onboardingData?.hobbies || 'Coding, Travelling',
    strengths: onboardingData?.strengths || 'Problem-solving, Leadership',
    careerAspirations: onboardingData?.careerAspirations || 'Professional',
    learningMode: onboardingData?.learningMode || 'Offline (Classroom/Lab)',
    city: user?.city || 'Shegaon',
    state: user?.state || 'Maharashtra',
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Image size should be less than 3 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRedeemCode = (e) => {
    e.preventDefault();
    setRedeemError('');
    if (!workshopCode.trim()) {
      setRedeemError('Please enter a workshop code.');
      return;
    }
    const cleanCode = workshopCode.trim().toUpperCase();
    if (cleanCode === 'SHEGAON26' || cleanCode === 'SKILLSENSE') {
      setCredits((prev) => prev + 1);
      setCodeRedeemed(true);
      setWorkshopCode('');
      setTimeout(() => setCodeRedeemed(false), 4000);
    } else {
      setRedeemError('Invalid code! Try SHEGAON26');
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setIsEditing(false);
    if (onSave) onSave({ ...formData, name: formData.fullName, grade: formData.educationStage, avatar: avatarImage });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const identityFields = [
    { icon: User, label: 'Full Name', value: formData.fullName },
    { icon: Mail, label: 'Email', value: formData.email },
    { icon: Phone, label: 'Phone', value: formData.phone },
    { icon: Calendar, label: 'Age', value: formData.age + ' Years' },
    { icon: GraduationCap, label: 'Education', value: formData.educationStage },
    { icon: MapPin, label: 'Location', value: formData.city + ', ' + formData.state },
    { icon: BookOpen, label: 'Learning Mode', value: formData.learningMode },
  ];

  const editFields = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'age', label: 'Age' },
    { key: 'educationStage', label: 'Education' },
    { key: 'learningMode', label: 'Learning Mode' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'careerAspirations', label: 'Career Aspirations' },
    { key: 'stream', label: 'Stream' },
    { key: 'enjoySubjects', label: 'Subjects Enjoyed' },
    { key: 'interests', label: 'Interests' },
    { key: 'hobbies', label: 'Hobbies' },
    { key: 'strengths', label: 'Strengths' },
  ];

  const matchScore = 96;
  const ringRadius = 50;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference - (matchScore / 100) * circumference;

  const completenessChecks = [
    avatarImage,
    formData.phone,
    formData.age,
    formData.educationStage,
    formData.stream,
    formData.enjoySubjects,
    formData.interests,
    formData.hobbies,
    formData.strengths,
    formData.careerAspirations,
    formData.learningMode,
    formData.city,
    formData.state,
  ];
  const completenessFilled = completenessChecks.filter(Boolean).length;
  const completeness = Math.round((completenessFilled / completenessChecks.length) * 100);

  return (
    <div
      className="min-h-screen w-full pb-16"
      style={{ background: '#CFEDED', color: '#12302D' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-2 bg-white rounded-2xl shadow-md border border-[#E3EFEC] p-5 sm:p-6 sm:pr-28 md:pr-36 flex items-center justify-between gap-6 relative">
            <div
              className="absolute -top-6 -right-6 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(11,143,134,0.14), rgba(227,169,58,0.10), transparent 70%)' }}
            />
            <div className="flex items-center gap-5 z-10 min-w-0">
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0 cursor-pointer group"
                style={{ background: 'linear-gradient(135deg, #0B8F86, #063B37)', padding: 3 }}
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-bold overflow-hidden">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="" style={{ color: '#0B8F86' }}>
                      {formData.fullName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-[#12302D]/0 group-hover:bg-[#12302D]/40 flex items-center justify-center transition-all">
                  <Pencil className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              <div className="min-w-0">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block mb-1"
                  style={{ background: '#D8F2EC', color: '#0B8F86' }}
                >
                  Verified Student
                </span>
                <h1 className="text-xl sm:text-2xl font-semibold truncate" style={{ color: '#12302D' }}>
                  {formData.fullName}
                </h1>
                <p className="text-xs font-medium truncate" style={{ color: '#5B7975' }}>
                  {formData.educationStage} - {formData.city}, {formData.state}
                </p>
              </div>
            </div>

            {/* Organic Blob Shaped Video Container */}
            <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 right-4 md:right-6 z-10 pointer-events-none items-center justify-center">
              <div
                className="w-36 h-36 md:w-40 md:h-40 overflow-hidden shadow-xl border-4 border-white bg-[#D8F2EC] shrink-0 flex items-center justify-center"
                style={{
                  borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%',
                }}
              >
                <video
                  src={profileVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-[#E3EFEC] p-5 sm:p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: '#12302D' }}>Profile Completeness</h3>
              <span className="text-lg font-bold" style={{ color: '#0B8F86' }}>{completeness}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#D8F2EC' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: completeness + '%', background: 'linear-gradient(90deg, #0B8F86, #E3A93A)' }}
              />
            </div>
            <p className="text-xs mt-3" style={{ color: '#5B7975' }}>
              {completeness === 100
                ? 'Your profile is fully set up!'
                : 'Complete your profile for better career matches'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-[#E3EFEC] p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E3EFEC]">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2.5" style={{ color: '#12302D' }}>
                  <User className="w-5 h-5" style={{ color: '#0B8F86' }} />
                  Personal & Assessment Details
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#5B7975' }}>
                  {isEditing ? 'Update your profile details below' : 'Your academic and background profile'}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? 'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600' : 'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 text-white'}
                style={!isEditing ? { background: '#0B8F86' } : undefined}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {savedSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2.5">
                <Check className="w-5 h-5" /> Profile successfully updated!
              </div>
            )}

            {!isEditing ? (
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {identityFields.map((field, idx) => {
                    const FieldIcon = field.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3 py-1.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#CFEDED' }}>
                          <FieldIcon className="w-4 h-4" style={{ color: '#0B8F86' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#5B7975' }}>
                            {field.label}
                          </div>
                          <div className="text-sm font-semibold truncate" style={{ color: '#12302D' }}>
                            {field.value || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="flex items-center gap-3 p-4 rounded-xl border-l-4"
                  style={{ background: '#FCE9C6', borderColor: '#E3A93A' }}
                >
                  <Briefcase className="w-5 h-5 shrink-0" style={{ color: '#8A5E10' }} />
                  <p className="text-sm font-semibold" style={{ color: '#553C0C' }}>
                    Aiming to become a <span className="">{formData.careerAspirations}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <TagGroup icon={Compass} title="Stream" items={formData.stream} tone="teal" />
                  <TagGroup icon={Heart} title="Subjects Enjoyed" items={formData.enjoySubjects} tone="blue" />
                  <TagGroup icon={Sparkles} title="Interests" items={formData.interests} tone="gold" />
                  <TagGroup icon={Award} title="Hobbies" items={formData.hobbies} tone="teal" />
                  <TagGroup icon={TrendingUp} title="Strengths" items={formData.strengths} tone="purple" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {editFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5B7975' }}>
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-medium transition-all border"
                        style={{ background: '#CFEDED', borderColor: '#CDE6E2' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E3EFEC' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl border text-sm font-semibold"
                    style={{ borderColor: '#E3EFEC', color: '#5B7975' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm"
                    style={{ background: '#0B8F86' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">

            <div className="bg-white rounded-2xl shadow-md border border-[#E3EFEC] p-6 flex items-center gap-5">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
                  <circle cx="60" cy="60" r={ringRadius} stroke="#D8F2EC" strokeWidth="10" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    stroke="#0B8F86"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold" style={{ color: '#12302D' }}>{matchScore}%</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#12302D' }}>Career Match Score</h3>
                <p className="text-xs mt-0.5 mb-2" style={{ color: '#5B7975' }}>Based on your evaluation profile</p>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">High Fit</span>
              </div>
            </div>

            <div className="text-white rounded-2xl shadow-md p-6" style={{ background: 'linear-gradient(135deg, #063B37, #0B8F86)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/10">
                  <CreditCard className="w-5 h-5" style={{ color: '#E3A93A' }} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(217,164,65,0.2)', color: '#F0C061' }}>
                  Workshop Code
                </span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#6FCBC0' }}>Credits</span>
                  <div className="text-2xl font-semibold mt-0.5">{credits}</div>
                </div>
                <button
                  onClick={onGoToPricing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold shadow"
                  style={{ background: '#E3A93A', color: '#12302D' }}
                >
                  Buy More
                </button>
              </div>
              <form onSubmit={handleRedeemCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="SHEGAON26"
                  value={workshopCode}
                  onChange={(e) => setWorkshopCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-medium uppercase text-white placeholder-white/40 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold shrink-0"
                  style={{ background: '#6FCBC0', color: '#063B37' }}
                >
                  Redeem
                </button>
              </form>
              {codeRedeemed && (
                <p className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> +1 Credit added!
                </p>
              )}
              {redeemError && <p className="text-[11px] font-medium text-rose-300 mt-2">{redeemError}</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-[#E3EFEC] divide-y" style={{ borderColor: '#E3EFEC' }}>
              <button
                onClick={onViewReport}
                className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#CFEDED] transition-colors rounded-t-2xl"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isPurchased ? '#D8F2EC' : '#FCE9C6' }}>
                  {isPurchased ? <FileText className="w-5 h-5" style={{ color: '#0B8F86' }} /> : <Lock className="w-5 h-5" style={{ color: '#8A5E10' }} />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: '#12302D' }}>Career Report</div>
                  <div className="text-xs" style={{ color: '#5B7975' }}>{isPurchased ? 'View your full roadmap' : 'Unlock premium insights'}</div>
                </div>
              </button>
              <a
                href="#ai-counselor"
                className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#CFEDED] transition-colors rounded-b-2xl"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#DCE8FC' }}>
                  <MessageCircle className="w-5 h-5" style={{ color: '#2E4F9E' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: '#12302D' }}>AI Career Counselor</div>
                  <div className="text-xs" style={{ color: '#5B7975' }}>Chat for instant guidance</div>
                </div>
              </a>
            </div>

          </div>
        </div>

        {/* History card */}
        <div className="w-full bg-white rounded-2xl shadow-md border border-[#E3EFEC] p-6 sm:p-7">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: '#12302D' }}>
            <HistoryIcon className="w-4 h-4" style={{ color: '#0B8F86' }} />
            History
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {historyLog.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#CFEDED' }}>
                    <ItemIcon className="w-4 h-4" style={{ color: '#0B8F86' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#12302D' }}>{item.label}</span>
                      <span className="text-[10px] font-semibold shrink-0 flex items-center gap-1" style={{ color: '#5B7975' }}>
                        <Clock className="w-3 h-3" /> {item.when}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#5B7975' }}>{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}