import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { assessmentApi } from '../../api/assessmentApi';
import { paymentApi } from '../../api/paymentApi';
import { authApi } from '../../api/authApi';
import { AVATAR_LIST, normalizeAvatarKey, resolveAvatarUrl, DEFAULT_AVATAR_KEY } from '../../utils/avatarUtils';
import { CLASS_YEAR_GROUPS } from '../../utils/classYearUtils';
import {
  CreditCard, Lock, CheckCircle2, Check, Award, BookOpen, Compass,
  Sparkles, TrendingUp, User, FileText, Bot, Edit3, X, Mail, Phone,
  Calendar, MapPin, GraduationCap, Heart, Briefcase, Pencil, MessageCircle, History as HistoryIcon, Clock, ChevronRight
} from 'lucide-react';


import profileVideo from '../../assets/profile-video.mp4';

const TONE_STYLES = {
  teal: { bg: '#D8F2EC', text: '#0B8F86', border: '#A9E5D9' },
  blue: { bg: '#DCE8FC', text: '#2E4F9E', border: '#B9D0F7' },
  gold: { bg: '#FCE9C6', text: '#8A5E10', border: '#F2D28A' },
  purple: { bg: '#EBDBFB', text: '#6633A3', border: '#D6BAF5' },
};



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
  const initialAvatar = normalizeAvatarKey(user?.avatar || user?.profilePhoto || onboardingData?.avatar || onboardingData?.profilePhoto) || DEFAULT_AVATAR_KEY;
  const [avatarKey, setAvatarKey] = useState(initialAvatar);
  const [avatarImage, setAvatarImage] = useState(resolveAvatarUrl(initialAvatar) || user?.profilePhoto || null);
  const [credits, setCredits] = useState(user?.balance ?? 0);
  const [attempts, setAttempts] = useState([]);
  const [showAllAttempts, setShowAllAttempts] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [workshopCode, setWorkshopCode] = useState('');

  const fetchSummary = () => {
    setLoadingSummary(true);
    setSummaryError(null);
    assessmentApi.getAccountSummary()
      .then(res => {
        if (res && res.status === 'success') {
          if (res.wallet && typeof res.wallet.balance === 'number') {
            setCredits(res.wallet.balance);
          }
          if (Array.isArray(res.attempts)) {
            const seen = new Set();
            const unique = [];
            for (const a of res.attempts) {
              if (a && a.id && !seen.has(a.id)) {
                seen.add(a.id);
                unique.push(a);
              }
            }
            setAttempts(unique);
          }
        }
      })
      .catch(err => {
        console.error("Failed to load account summary:", err);
        setSummaryError(err?.message || 'Failed to load assessment history.');
      })
      .finally(() => setLoadingSummary(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (user?.avatar || user?.profilePhoto) {
      const k = normalizeAvatarKey(user?.avatar || user?.profilePhoto);
      if (k) {
        setAvatarKey(k);
        setAvatarImage(resolveAvatarUrl(k));
      }
    }
  }, [user]);

  const [codeRedeemed, setCodeRedeemed] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getInitialName = () => {
    const raw = user?.full_name || user?.name || onboardingData?.fullName || '';
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (['guest', 'guest student', 'test student'].includes(trimmed.toLowerCase())) return '';
    return trimmed;
  };

  const getInitialAge = () => {
    const raw = user?.age ?? onboardingData?.age;
    if (raw === '' || raw === null || raw === undefined) return '';
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 10 || num > 60) return '';
    return String(num);
  };

  const [formData, setFormData] = useState({
    fullName: getInitialName(),
    email: user?.email || '',
    phone: user?.phone || '',
    age: getInitialAge(),
    educationStage: user?.class_year || user?.education_level || onboardingData?.classYear || '',
    stream: user?.stream || onboardingData?.stream || '',
    enjoySubjects: user?.enjoy_subjects || onboardingData?.enjoySubjects || '',
    challengingSubjects: user?.challenging_subjects || onboardingData?.challengingSubjects || '',
    interests: user?.interests || onboardingData?.interests || '',
    hobbies: user?.hobbies || onboardingData?.hobbies || '',
    strengths: user?.strengths || onboardingData?.strengths || '',
    careerAspirations: user?.career_aspirations || onboardingData?.careerAspirations || '',
    learningMode: user?.learning_mode || onboardingData?.learningMode || 'Offline (Classroom/Lab)',
    city: user?.city || 'Shegaon',
    state: user?.state || 'Maharashtra',
  });

  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    canvas.width = 400; 
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 400, 400);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setAvatarImage(croppedImage);
      setCropImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10 MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    setRedeemError('');
    const cleanCode = (workshopCode || '').trim().toUpperCase();
    if (!cleanCode) {
      setRedeemError('Please enter a workshop or campaign code.');
      return;
    }
    try {
      const planRes = await paymentApi.getLowestPlan();
      const planId = planRes?.lowest_plan?.id || planRes?.plan?.id || 'plan_Standard';
      const valRes = await paymentApi.validateCoupon(planId, cleanCode);
      if (!valRes.valid) {
        setRedeemError(valRes.message || 'Invalid or expired code.');
        return;
      }
      if (valRes.final_price <= 0) {
        const res = await paymentApi.redeemZero(planId, cleanCode);
        const newBal = typeof res.new_balance === 'number' ? res.new_balance : res.balance;
        if (typeof newBal === 'number') {
          setCredits(newBal);
        } else {
          setCredits((prev) => prev + (valRes.credits || 1));
        }
        setCodeRedeemed(true);
        setWorkshopCode('');
        setTimeout(() => setCodeRedeemed(false), 4000);
      } else {
        setRedeemError(`Code applied! Grants discount at checkout (Final price: ₹${valRes.final_price}).`);
      }
    } catch (err) {
      console.error('Code redemption error:', err);
      setRedeemError(err.message || 'Failed to redeem code.');
    }
  };

  const selectAvatar = (item) => {
    setAvatarKey(item.key);
    setAvatarImage(item.path);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    try {
      const canonicalAvatar = normalizeAvatarKey(avatarKey || avatarImage) || DEFAULT_AVATAR_KEY;
      const parsedAge = formData.age ? parseInt(formData.age, 10) : null;
      if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 60)) {
        setSaveError('Age must be a valid whole number between 10 and 60.');
        setIsSaving(false);
        return;
      }

      const payload = {
        full_name: formData.fullName,
        fullName: formData.fullName,
        name: formData.fullName,
        phone: formData.phone,
        age: parsedAge,
        class_year: formData.educationStage,
        classYear: formData.educationStage,
        grade: formData.educationStage,
        stream: formData.stream,
        enjoy_subjects: formData.enjoySubjects,
        enjoySubjects: formData.enjoySubjects,
        challenging_subjects: formData.challengingSubjects,
        challengingSubjects: formData.challengingSubjects,
        interests: formData.interests,
        hobbies: formData.hobbies,
        strengths: formData.strengths,
        career_aspirations: formData.careerAspirations,
        learning_mode: formData.learningMode,
        city: formData.city,
        state: formData.state,
        avatar: canonicalAvatar,
        profilePhoto: resolveAvatarUrl(canonicalAvatar) || avatarImage
      };

      const res = await authApi.updateProfile(payload);
      const updatedUser = res?.user || { ...user, ...payload };
      setSavedSuccess(true);
      setIsEditing(false);
      if (onSave) onSave(updatedUser);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const identityFields = [
    { icon: User, label: 'Full Name', value: formData.fullName || '-' },
    { icon: Mail, label: 'Email', value: formData.email || '-' },
    { icon: Phone, label: 'Phone', value: formData.phone || '-' },
    { icon: Calendar, label: 'Age', value: formData.age ? `${formData.age} Years` : '-' },
    { icon: GraduationCap, label: 'Education', value: formData.educationStage || '-' },
    { icon: MapPin, label: 'Location', value: (formData.city || formData.state) ? `${formData.city}, ${formData.state}` : '-' },
    { icon: BookOpen, label: 'Learning Mode', value: formData.learningMode || '-' },
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

  const latestAttempt = attempts && attempts.length > 0 ? attempts[0] : null;
  const matchScore = latestAttempt?.teaser?.primary_match_score || 92;
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
                      {(formData.fullName || user?.email || 'Student').slice(0, 2).toUpperCase()}
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
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'DEVELOPER' ? 'Verified Developer' : 'Verified Student'}
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
                <div className="bg-[#CFEDED]/30 p-4 rounded-xl border border-[#CDE6E2] mb-5">
                  <label className="block text-xs font-semibold mb-3" style={{ color: '#5B7975' }}>Select an Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_LIST.map((item) => {
                      const isSelected = (avatarKey === item.key) || (avatarImage === item.path);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => selectAvatar(item)}
                          className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 cursor-pointer ${
                            isSelected ? 'border-[#0B8F86] ring-2 ring-[#0B8F86]/40 shadow-md scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={item.path} alt={item.key} className="w-full h-full object-cover bg-white" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {editFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5B7975' }}>
                        {field.label}
                      </label>
                      {field.key === 'educationStage' ? (
                        <select
                          value={formData.educationStage}
                          onChange={(e) => setFormData({ ...formData, educationStage: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-medium transition-all border cursor-pointer"
                          style={{ background: '#CFEDED', borderColor: '#CDE6E2', color: '#12302D' }}
                        >
                          <option value="">Select your class/year</option>
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
                      ) : (
                        <input
                          type={field.key === 'age' ? 'number' : 'text'}
                          min={field.key === 'age' ? '10' : undefined}
                          max={field.key === 'age' ? '60' : undefined}
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-medium transition-all border"
                          style={{ background: '#CFEDED', borderColor: '#CDE6E2' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {saveError && (
                  <p className="text-xs text-rose-500 font-semibold mt-2">{saveError}</p>
                )}
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
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    style={{ background: '#0B8F86' }}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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
                onClick={() => {
                  if (attempts && attempts.length > 0) {
                    if (onViewReport) onViewReport(attempts[0]);
                  } else {
                    if (onBack) onBack();
                  }
                }}
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
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#12302D' }}>
              <HistoryIcon className="w-4 h-4" style={{ color: '#0B8F86' }} />
              Assessment History & Reports
            </h3>
            <span className="text-xs font-bold text-[#0B8F86] bg-[#CFEDED] px-2.5 py-0.5 rounded-full">
              {loadingSummary ? 'Loading...' : `${attempts.length} ${attempts.length === 1 ? 'Attempt' : 'Attempts'}`}
            </span>
          </div>

          {loadingSummary ? (
            <div className="py-10 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin w-7 h-7 border-2 border-[#0B8F86] border-t-transparent rounded-full" />
              <p className="text-xs text-[#5B7975]">Loading your assessment history...</p>
            </div>
          ) : summaryError ? (
            <div className="text-center py-8">
              <p className="text-sm text-rose-500 mb-3">{summaryError}</p>
              <button
                type="button"
                onClick={fetchSummary}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0B8F86] hover:bg-[#09776f] transition-all cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#5B7975] mb-3">No completed assessments recorded yet.</p>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0B8F86] hover:bg-[#09776f] transition-all cursor-pointer"
              >
                Take Career Assessment
              </button>
            </div>
          ) : (
            <>
            <div className="divide-y divide-[#E3EFEC]">
              {(showAllAttempts ? attempts : attempts.slice(0, 3)).map((att, idx) => {
                const dateRaw = att.completed_at || att.created_at;
                const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
                const isUnlocked = Boolean(att.is_unlocked === 1 || att.is_unlocked === true);

                return (
                  <div key={att.id || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: isUnlocked ? '#D1FAE5' : '#CFEDED' }}>
                        <Compass className="w-5 h-5" style={{ color: isUnlocked ? '#059669' : '#0B8F86' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#12302D]">
                            {att.riasec_code ? `RIASEC: ${att.riasec_code}` : 'Career Assessment'}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isUnlocked ? 'Unlocked' : 'Locked Teaser'}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B7975] mt-0.5">
                          {att.primary_career_title ? `${att.primary_career_title} · ` : ''}Completed on {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onViewReport && onViewReport(att)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#12302D] hover:bg-[#075f5c] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Full Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (credits >= 1) {
                              assessmentApi.unlockAttempt(att.id)
                                .then((res) => {
                                  const updatedBal = typeof res?.credits_remaining === 'number' ? res.credits_remaining : Math.max(0, credits - 1);
                                  setCredits(updatedBal);
                                  setAttempts(prev => prev.map(a => a.id === att.id ? { ...a, is_unlocked: 1, is_unlocked_bool: true } : a));
                                  if (onViewReport) onViewReport({ ...att, is_unlocked: 1, full_report: res?.full_report });
                                })
                                .catch(err => {
                                  if (err?.status === 402 || err?.data?.insufficient_credits) {
                                    if (onGoToPricing) onGoToPricing();
                                  } else {
                                    alert(err?.message || err?.data?.error || 'Unlock failed.');
                                  }
                                });
                            } else {
                              try {
                                sessionStorage.setItem('skillsense_unlock_target', JSON.stringify({
                                  attemptId: att.id,
                                  date: dateStr,
                                  riasec_code: att.riasec_code,
                                  title: att.primary_career_title
                                }));
                                sessionStorage.setItem('skillsense_active_assessment_flow', JSON.stringify({
                                  attemptId: att.id,
                                  flowState: 'awaiting_credit_purchase',
                                  completedAt: Date.now(),
                                  dismissed: false
                                }));
                              } catch (e) {}
                              localStorage.setItem('skillsense_return_to_unlock', att.id);
                              if (onGoToPricing) onGoToPricing();
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0B8F86] hover:bg-[#09776f] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{credits >= 1 ? 'Unlock (1 Credit)' : 'Buy 1 Credit to Unlock'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {attempts.length > 3 && (
              <div className="pt-3 text-center border-t border-[#E3EFEC]">
                <button
                  type="button"
                  onClick={() => setShowAllAttempts(prev => !prev)}
                  className="text-xs font-bold text-[#0B8F86] hover:text-[#075f5c] transition-colors py-1.5 px-4 rounded-xl hover:bg-[#CFEDED]/50 cursor-pointer"
                >
                  {showAllAttempts ? 'Show Recent (3)' : `Show All (${attempts.length} Assessments)`}
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Crop Profile Photo</h3>
              <button onClick={() => setCropImageSrc(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full h-[300px] bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#09A3A3]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCropImageSrc(null)}
                  className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  className="flex-1 bg-[#09A3A3] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078585] transition-colors"
                >
                  Crop & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}