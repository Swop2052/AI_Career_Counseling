import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import LinkedInShareCard from './LinkedInShareCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, ArrowRight, ShieldCheck,
  Brain, Heart, GraduationCap, Trophy,
  Rocket, TrendingUp, Award, Target,
  Sparkles, Info, X, DollarSign, BookOpen,
  Briefcase, ChevronRight, Compass, Download, Share2,
  BarChart3, LineChart, Star
} from 'lucide-react';
import CareerDetailModal from './CareerDetailModal';
import { useLanguage } from '../translations/LanguageContext';
import LeavesIllustration from '../assets/leaves_illustration.jpg';

const repT = {
  en: {
    traitProfile: "Trait Profile",
    mindText: "Leadership and persuasive traits dominate your analytical thinking.",
    bodyText: "You do best in environments that are structured and well organized.",
    soulText: "Driven by impact, leadership, and meaningful professional connection.",
    mind: "Mind",
    body: "Body",
    soul: "Soul",
    downloadReport: "Download PDF",
    realisticDesc: "Practical, hands-on, and action-oriented.",
    realisticEx: "e.g., Engineer, Architect",
    investigativeDesc: "Analytical, intellectual, and scientific thinkers.",
    investigativeEx: "e.g., Scientist, Researcher",
    artisticDesc: "Creative, expressive, and original creators.",
    artisticEx: "e.g., Designer, Writer",
    socialDesc: "Empathetic, helpful, and community-driven.",
    socialEx: "e.g., Teacher, Counselor",
    enterprisingDesc: "Ambitious, persuasive, and visionary leaders.",
    enterprisingEx: "e.g., Entrepreneur, Manager",
    conventionalDesc: "Organized, detail-oriented, and systematic experts.",
    conventionalEx: "e.g., Accountant, Analyst",
  },
  mr: {
    traitProfile: "व्यक्तिमत्व विश्लेषण",
    mindText: "विश्लेषणात्मक विचार आणि नेतृत्व करण्याची क्षमता.",
    bodyText: "सुव्यवस्थित आणि शिस्तबद्ध वातावरणात तुम्ही उत्तम काम करता.",
    soulText: "सामाजिक प्रभाव, नेतृत्व आणि व्यावसायिक संबंधांद्वारे प्रेरित.",
    mind: "बुद्धी",
    body: "शरीर",
    soul: "आत्मा",
    downloadReport: "PDF डाउनलोड करा",
    realisticDesc: "व्यावहारिक आणि कृती-देणारी कार्ये.",
    realisticEx: "उदा., इंजिनिअर, आर्किटेक्ट",
    investigativeDesc: "विश्लेषणात्मक आणि वैज्ञानिक विचार.",
    investigativeEx: "उदा., शास्त्रज्ञ, संशोधक",
    artisticDesc: "सर्जनशील आणि मूळ विचार.",
    artisticEx: "उदा., डिझायनर, लेखक",
    socialDesc: "सहानुभूतीपूर्ण आणि मदतीस तत्पर.",
    socialEx: "उदा., शिक्षक, समुपदेशक",
    enterprisingDesc: "महत्वाकांक्षी आणि नेतृत्व करणारे.",
    enterprisingEx: "उदा., उद्योजक, मॅनेजर",
    conventionalDesc: "सुव्यवस्थित आणि शिस्तबद्ध तज्ञ.",
    conventionalEx: "उदा., अकाउंटंट, ॲनालिस्ट",
  },
  hi: {
    traitProfile: "व्यक्तित्व विश्लेषण",
    mindText: "विश्लेषणात्मक सोच और नेतृत्व करने की क्षमता।",
    bodyText: "सुव्यवस्थित और अनुशासित वातावरण में आप बेहतर काम करते हैं।",
    soulText: "सामाजिक प्रभाव, नेतृत्व और सार्थक व्यावसायिक संबंधों से प्रेरित।",
    mind: "बुद्धि",
    body: "शरीर",
    soul: "आत्मा",
    downloadReport: "PDF डाउनलोड करें",
    realisticDesc: "व्यावहारिक और कार्रवाई उन्मुख।",
    realisticEx: "उदा., इंजीनियर, आर्किटेक्ट",
    investigativeDesc: "विश्लेषणात्मक और वैज्ञानिक विचारक।",
    investigativeEx: "उदा., वैज्ञानिक, शोधकर्ता",
    artisticDesc: "रचनात्मक और मूल विचारक।",
    artisticEx: "उदा., डिजाइनर, लेखक",
    socialDesc: "सहानुभूतिपूर्ण और मददगार।",
    socialEx: "उदा., शिक्षक, काउंसलर",
    enterprisingDesc: "महत्वाकांक्षी और नेतृत्व करने वाले।",
    enterprisingEx: "उदा., उद्यमी, मैनेजर",
    conventionalDesc: "सुव्यवस्थित और व्यवस्थित विशेषज्ञ।",
    conventionalEx: "उदा., अकाउंटेंट, एनालिस्ट",
  }
};

const DEEP = '#04302E';
const TEAL = '#09A3A3';
const GOLD = '#E8B04B';
const PURPLE = '#6D5AE0';

export default function ReportCardPage({ isPurchased = false, onCreateAccount, onGoToPricing, onUnlockReport, user = null, currentUser = null, reportData = null }) {
  const { language } = useLanguage();
  const shareCardRef = useRef(null);
  const reportRef = useRef(null);
  const t = repT[language] || repT.en;

  const [selectedCareer, setSelectedCareer] = useState(null);
  const [defaultCareers, setDefaultCareers] = useState(null);
  const [defaultRIASEC, setDefaultRIASEC] = useState(null);
  const [preGeneratedBlob, setPreGeneratedBlob] = useState(null);

  useEffect(() => {
    if (!reportData) {
      fetch('/api/all-careers')
        .then(res => res.json())
        .then(data => {
          if (data && data.careers) {
            const placeholderCareers = data.careers.slice(0, 6).map((c, idx) => {
              let streamInfo = 'Any Stream';
              if (c.educational_pathway && c.educational_pathway.length > 0) {
                  streamInfo = c.educational_pathway[0]?.stream || c.educational_pathway[0]?.degree || 'Any Stream';
              }
              const traits = c.personality_traits?.join(', ') || c.personality_traits || 'Problem solving, logical reasoning';
              const growthPath = Array.isArray(c.growth_path) ? c.growth_path.join(' → ') : (c.growth_path || 'Junior → Senior → Lead');
          
              return {
                rank: idx + 1,
                title: c.career_name,
                stream: streamInfo,
                match: 95 - idx * 3,
                salary: '₹1,50,000 – ₹3,00,000 / mo',
                fee: '₹50,000 – ₹2,00,000',
                description: c.description || '',
                traits: traits,
                growthPath: growthPath,
                icon: [Rocket, TrendingUp, Award, Compass, Target, Briefcase][idx % 6],
                color: [PURPLE, TEAL, GOLD, '#2E86AB', TEAL, PURPLE][idx % 6],
              };
            });
            setDefaultCareers(placeholderCareers);
            
            setDefaultRIASEC([
              { key: 'R', label: 'Realistic', score: 49, color: '#5C8374', desc: t.realisticDesc, example: t.realisticEx },
              { key: 'I', label: 'Investigative', score: 51, color: '#2E86AB', desc: t.investigativeDesc, example: t.investigativeEx },
              { key: 'A', label: 'Artistic', score: 40, color: GOLD, desc: t.artisticDesc, example: t.artisticEx },
              { key: 'S', label: 'Social', score: 40, color: TEAL, desc: t.socialDesc, example: t.socialEx },
              { key: 'E', label: 'Enterprising', score: 51, color: PURPLE, desc: t.enterprisingDesc, example: t.enterprisingEx },
              { key: 'C', label: 'Conventional', score: 74, color: DEEP, desc: t.conventionalDesc, example: t.conventionalEx },
            ]);
          }
        })
        .catch(err => {
          console.error("Failed to load placeholder careers from backend:", err);
          setDefaultCareers([
            {
              rank: 1,
              title: "Software Engineer / Tech Architect",
              stream: "Science / Engineering",
              match: 95,
              salary: "₹1,50,000 - ₹3,50,000 / mo",
              fee: "₹2,00,000 - ₹8,00,000",
              description: "Designs, codes, and architect modern scalable software systems.",
              traits: "Problem solving, logical reasoning",
              growthPath: "Junior -> Senior -> Tech Lead -> Principal Architect",
              icon: Rocket,
              color: PURPLE,
            },
            {
              rank: 2,
              title: "Data Scientist & AI Specialist",
              stream: "Science / Mathematics",
              match: 92,
              salary: "₹1,80,000 - ₹4,00,000 / mo",
              fee: "₹3,00,000 - ₹10,00,000",
              description: "Builds predictive statistical models and cutting-edge artificial intelligence.",
              traits: "Analytical mindset, curiosity",
              growthPath: "Analyst -> Senior Data Scientist -> Head of AI",
              icon: TrendingUp,
              color: TEAL,
            },
            {
              rank: 3,
              title: "Cybersecurity Analyst",
              stream: "Information Technology",
              match: 89,
              salary: "₹1,20,000 - ₹2,80,000 / mo",
              fee: "₹1,50,000 - ₹5,00,000",
              description: "Guards network boundaries, cloud infrastructure, and organizational data.",
              traits: "Vigilance, investigative depth",
              growthPath: "Security Engineer -> Security Architect -> CISO",
              icon: Award,
              color: GOLD,
            },
            {
              rank: 4,
              title: "Product Manager",
              stream: "Any Stream / Management",
              match: 86,
              salary: "₹1,40,000 - ₹3,20,000 / mo",
              fee: "₹2,00,000 - ₹9,00,000",
              description: "Guides product strategy, roadmaps, and cross-functional execution.",
              traits: "Leadership, communication",
              growthPath: "Associate PM -> Senior PM -> VP Product",
              icon: Compass,
              color: '#2E86AB',
            }
          ]);
          setDefaultRIASEC([
            { key: 'R', label: 'Realistic', score: 65, color: '#5C8374', desc: t.realisticDesc, example: t.realisticEx },
            { key: 'I', label: 'Investigative', score: 78, color: '#2E86AB', desc: t.investigativeDesc, example: t.investigativeEx },
            { key: 'A', label: 'Artistic', score: 70, color: GOLD, desc: t.artisticDesc, example: t.artisticEx },
            { key: 'S', label: 'Social', score: 85, color: TEAL, desc: t.socialDesc, example: t.socialEx },
            { key: 'E', label: 'Enterprising', score: 94, color: PURPLE, desc: t.enterprisingDesc, example: t.enterprisingEx },
            { key: 'C', label: 'Conventional', score: 82, color: DEEP, desc: t.conventionalDesc, example: t.conventionalEx },
          ]);
        });
    }
  }, [reportData, t]);

  // Dynamic RIASEC Scores (supports both .scores and .riasec_scores)
  const rawScores = reportData?.scores || reportData?.riasec_scores;
  const dynamicRIASEC = rawScores ? [
    { key: 'R', label: 'Realistic', score: Math.round(((rawScores['R'] || 0) / 35) * 100), color: '#5C8374', desc: t.realisticDesc, example: t.realisticEx },
    { key: 'I', label: 'Investigative', score: Math.round(((rawScores['I'] || 0) / 35) * 100), color: '#2E86AB', desc: t.investigativeDesc, example: t.investigativeEx },
    { key: 'A', label: 'Artistic', score: Math.round(((rawScores['A'] || 0) / 35) * 100), color: GOLD, desc: t.artisticDesc, example: t.artisticEx },
    { key: 'S', label: 'Social', score: Math.round(((rawScores['S'] || 0) / 35) * 100), color: TEAL, desc: t.socialDesc, example: t.socialEx },
    { key: 'E', label: 'Enterprising', score: Math.round(((rawScores['E'] || 0) / 35) * 100), color: PURPLE, desc: t.enterprisingDesc, example: t.enterprisingEx },
    { key: 'C', label: 'Conventional', score: Math.round(((rawScores['C'] || 0) / 35) * 100), color: DEEP, desc: t.conventionalDesc, example: t.conventionalEx },
  ] : defaultRIASEC;

  const personalityCode = dynamicRIASEC 
    ? [...dynamicRIASEC].sort((a, b) => b.score - a.score).slice(0, 3).map(d => d.key).join('')
    : 'CIE';

  const dynamicCareers = reportData?.top_careers ? reportData.top_careers.map((c, idx) => {
    const careerData = (c.data && typeof c.data === 'object' && Object.keys(c.data).length > 0) ? c.data : c;
    const minSalary = careerData?.expected_income?.minimum_monthly_salary || careerData?.minimum_monthly_salary || '';
    const maxSalary = careerData?.expected_income?.maximum_monthly_salary || careerData?.maximum_monthly_salary || '';
    const salaryStr = (minSalary && maxSalary) ? `${minSalary} – ${maxSalary} / mo` : (minSalary || maxSalary || '₹1,50,000 – ₹3,00,000 / mo');
    
    const feeInfo = careerData?.course_fee?.estimated_total_fee || careerData?.course_fee?.fee_range || careerData?.estimated_total_fee || '₹50,000 – ₹2,00,000';
    let streamInfo = 'Any Stream';
    if (careerData?.educational_pathway && Array.isArray(careerData.educational_pathway) && careerData.educational_pathway.length > 0) {
        streamInfo = careerData.educational_pathway[0]?.stream || careerData.educational_pathway[0]?.degree || 'Any Stream';
    }
    const traits = Array.isArray(careerData?.personality_traits) ? careerData.personality_traits.join(', ') : (careerData?.personality_traits || 'Problem solving, logical reasoning');
    const growthPath = Array.isArray(careerData?.growth_path) ? careerData.growth_path.join(' → ') : (careerData?.growth_path || 'Junior → Senior → Lead');

    const rawScore = c.match_score ?? c.score ?? c.fit_score ?? 85;
    const matchScore = Math.round(Number(rawScore) || 85);

    return {
      rank: idx + 1,
      title: c.name || c.career_name || 'Career Match',
      stream: streamInfo,
      match: matchScore,
      salary: salaryStr,
      fee: feeInfo,
      description: careerData?.description || c.reason || '',
      traits: traits,
      growthPath: growthPath,
      icon: [Rocket, TrendingUp, Award, Compass, Target, Briefcase][idx % 6],
      color: [PURPLE, TEAL, GOLD, '#2E86AB', TEAL, PURPLE][idx % 6],
      rawData: careerData,
      reason: c.reason || careerData?.reason || ''
    };
  }) : defaultCareers;

  useEffect(() => {
    if (shareCardRef.current && dynamicCareers && dynamicCareers.length > 0) {
      const timer = setTimeout(() => {
        html2canvas(shareCardRef.current, { backgroundColor: '#ffffff', scale: 2, logging: false })
          .then(canvas => {
            canvas.toBlob(blob => {
              if (blob) setPreGeneratedBlob(blob);
            }, 'image/png');
          })
          .catch(err => console.error("Failed to pre-generate share card", err));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dynamicCareers]);

  if (!dynamicCareers || !dynamicRIASEC) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-[#09A3A3] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const fullName = user?.name || 'Student';
  const studentName = fullName.split(' ')[0];
  const profilePhoto = user?.profilePhoto || user?.avatar || null;
  const topMatch = dynamicCareers[0];

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 1.5, 
        useCORS: true, 
        backgroundColor: '#F6FBFA' 
      });
      
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Failed to create image blob.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `SkillSense_Career_Report_${studentName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png", 1.0);
    } catch (err) {
      console.error("Error generating report", err);
      alert("Failed to download report. Please try again.");
    }
  };

  const handleLinkedInShare = async () => {
    const appUrl = window.location.origin;
    const matchScore = topMatch?.match || 96;
    
    const topTraits = dynamicRIASEC 
      ? [...dynamicRIASEC].sort((a, b) => b.score - a.score).slice(0, 3).map(d => d.label).join(', ')
      : 'Organized, Detail Oriented, Structured';
      
    const careerList = (dynamicCareers || []).slice(0, 6)
      .map((c, i) => `${i + 1}️⃣ ${c.title}`)
      .join('\n');
      
    const rawName = user?.name || 'Student';
    const nameOnly = rawName.includes('@') ? rawName.split('@')[0] : rawName;
    const nameNoSpaces = nameOnly.replace(/[^a-zA-Z0-9]/g, '');

    const shareText = `🌟 Let's Connect! My SkillSense Career Assessment Results! 🚀\n\n${nameOnly} is a ${topTraits} individual. Based on their profile, they are highly aligned with careers like ${(dynamicCareers || []).slice(0,3).map(c=>c.title).join(', ')}.\n\n🧠 Key Traits: ${topTraits}\n📊 Personality Code: ${personalityCode}\n\n🎯 Top Recommended Careers:\n${careerList}\n\nExplore your path at ${appUrl}!\n\n#VitalsAndVectors #SkillSense #CareerGuidance #AIGuidance #${nameNoSpaces}`;

    const linkedInWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (linkedInWindow) {
      linkedInWindow.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f3f2ef;"><h2 style="text-align:center;color:#0a66c2;">Preparing your SkillSense post...</h2></body></html>');
    }
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;

    try {
      if (preGeneratedBlob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': preGeneratedBlob })
        ]);
        // Silently copied to clipboard
      }
      if (linkedInWindow) {
        linkedInWindow.location.href = linkedInUrl;
      } else {
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error("Clipboard share failed", err);
      if (preGeneratedBlob) {
          try {
            const dataUrl = URL.createObjectURL(preGeneratedBlob);
            const link = document.createElement('a');
            link.download = `SkillSense-Report-${nameNoSpaces}.png`;
            link.href = dataUrl;
            link.click();
          } catch(e) {}
      }
      if (linkedInWindow) {
        linkedInWindow.location.href = linkedInUrl;
      } else {
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const getDayStr = () => {
     const d = new Date();
     return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  };

  return (
    <div className="min-h-screen w-full py-8 sm:py-12 px-4 sm:px-8 md:px-10 flex justify-center" style={{ backgroundColor: '#F6FBFA' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      
      {/* Hidden card for LinkedIn sharing snapshot */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <LinkedInShareCard 
          ref={shareCardRef}
          user={user}
          dynamicCareers={dynamicCareers}
          personalityCode={personalityCode}
          dynamicRIASEC={dynamicRIASEC}
        />
      </div>

      <motion.div
        ref={reportRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-[1200px] w-full relative"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className={`transition-all duration-500 ${!isPurchased ? 'blur-[6px] select-none pointer-events-none opacity-70' : ''}`}>
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div></div>
          <div className="text-[#E8B04B] font-['Sora'] italic text-2xl opacity-90 pr-4">
            A Brighter <span className="underline decoration-2 underline-offset-4 decoration-[#E8B04B]">You</span>
          </div>
        </div>

        {/* Section 1: Hero Card */}
        <div className="bg-[#FAF9F6] rounded-[32px] p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 mb-8 border border-gray-200/50 shadow-sm relative overflow-hidden">
          
          {/* Left: Text */}
          <div className="flex-1 max-w-sm relative z-10 pl-2">
            <h1 className="text-5xl font-['Sora'] font-bold text-[#04302E] leading-[1.1] mb-2 tracking-tight">
              Career <br/><span className="text-[#09A3A3]">Readiness</span> <br/><span className="text-[#E8B04B]">Report</span>
            </h1>
            <p className="text-gray-600 mt-4 mb-6 font-medium text-[15px]">Your strengths today.<br/>A brighter tomorrow.</p>
            
            <div className="flex items-center gap-6 mt-8 border-t border-gray-200/60 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100"><BarChart3 className="w-5 h-5 text-teal-600"/></div>
                <div className="text-[10px] text-gray-500 leading-tight">Report Generated<br/><strong className="text-gray-900 text-xs">{getDayStr()}</strong></div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100"><LineChart className="w-5 h-5 text-teal-600"/></div>
                 <div className="text-[10px] text-gray-500 leading-tight">Career readiness report<br/><strong className="text-gray-900 text-xs">For a Better You</strong></div>
              </div>
            </div>
          </div>

          {/* Center: Avatar */}
          <div className="relative shrink-0 flex items-center justify-center lg:ml-8">
             <div className="absolute inset-0 bg-[#E8B04B]/15 rounded-full blur-3xl scale-150" />
             <div className="absolute -inset-4 border-2 border-dashed border-[#09A3A3]/20 rounded-full animate-[spin_40s_linear_infinite]" />
             
             <div className="w-[280px] h-[280px] rounded-full border-8 border-white shadow-xl overflow-hidden relative z-10 bg-[#CFEDED] flex items-center justify-center">
               {profilePhoto ? (
                  <img src={profilePhoto} crossOrigin="anonymous" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-7xl font-bold text-[#09A3A3] font-['Sora']">{studentName.charAt(0)}</span>
               )}
             </div>
             
             {/* Decorative Badge */}
             <div className="absolute -bottom-4 -right-4 bg-white px-5 py-3 rounded-2xl shadow-xl border border-gray-100 rotate-[-8deg] z-20">
               <span className="text-[13px] font-['Sora'] font-bold text-[#09A3A3] leading-tight block">Keep<br/>Exploring<br/>You Got This!</span>
             </div>
          </div>

          {/* Right: Profile Details & Stats */}
          <div className="flex-1 flex flex-col gap-5 relative z-10 w-full lg:max-w-[340px]">
             <div className="flex flex-col items-end gap-1 mb-2">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[20px] shadow-sm border border-gray-100 w-full">
                  <div className="w-10 h-10 bg-[#04302E] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                     {profilePhoto ? (
                       <img src={profilePhoto} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Profile" />
                     ) : (
                       fullName.slice(0, 2).toUpperCase()
                     )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#04302E] text-base">{fullName}</h3>
                  </div>
                </div>
                <div className="text-[11px] italic text-gray-500 font-serif mr-2 mt-1">
                   "Better Students Brighter Futures"
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 py-4 rounded-[16px] shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mb-2">
                     <Target className="w-4 h-4 text-[#09A3A3]" />
                   </div>
                   <span className="text-[9px] text-gray-400 font-medium leading-tight mb-1">Aptitude match</span>
                   <span className="font-bold text-lg text-[#04302E] leading-none">{topMatch?.match || 96}%</span>
                </div>
                <div className="bg-white p-3 py-4 rounded-[16px] shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                     <Brain className="w-4 h-4 text-[#6D5AE0]" />
                   </div>
                   <span className="text-[9px] text-gray-400 font-medium leading-tight mb-1">Top personality</span>
                   <span className="font-bold text-lg text-[#6D5AE0] leading-none">{personalityCode}</span>
                </div>
                <div className="bg-white p-3 py-4 rounded-[16px] shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                     <Compass className="w-4 h-4 text-[#E8B04B]" />
                   </div>
                   <span className="text-[9px] text-gray-400 font-medium leading-tight mb-1">Career paths mapped</span>
                   <span className="font-bold text-lg text-[#04302E] leading-none">6</span>
                </div>
             </div>

             <div className="flex items-center gap-3 mt-4">
                <button onClick={handleDownloadReport} className="flex-1 bg-[#04302E] hover:bg-[#064a47] text-white py-3.5 rounded-[14px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-all shadow-md hover:shadow-lg">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={handleLinkedInShare} className="flex-1 bg-white hover:bg-gray-50 text-[#04302E] border border-gray-200 py-3.5 rounded-[14px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-all shadow-sm hover:shadow-md">
                  <Share2 className="w-4 h-4" /> Share Report
                </button>
             </div>
          </div>
        </div>

        {/* Section 2: Middle Data */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Left: RIASEC */}
          <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-200/60 shadow-sm relative overflow-hidden flex flex-col">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h2 className="text-[22px] font-['Sora'] font-bold text-[#04302E] mb-1">Your Trait Profile</h2>
                 <p className="text-sm text-gray-500 font-medium">Your personality in action</p>
               </div>
             </div>
             
             <div className="flex gap-6 flex-1">
                {/* Bars */}
                <div className="flex-1 space-y-5 mt-2">
                   {dynamicRIASEC.map((d) => (
                      <div key={d.key} className="flex items-center gap-3 relative group">
                         <div className="w-[85px] shrink-0">
                           <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-help border-b border-dashed border-gray-300 pb-0.5">{d.label}</span>
                           <div className="absolute left-0 bottom-full mb-2 w-48 bg-[#04302E] text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                             <div className="font-bold mb-1 text-[#09A3A3]">{d.label}</div>
                             <div className="mb-2 text-white/90">{d.desc}</div>
                             <div className="text-white/60 italic text-[10px]">{d.example}</div>
                             <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#04302E] rotate-45"></div>
                           </div>
                         </div>
                         <div className="flex-1 h-7 rounded-r-lg rounded-l-sm bg-gray-100 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${d.score}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-r-lg rounded-l-sm" 
                              style={{ backgroundColor: d.color }} 
                            />
                         </div>
                         <span className="text-xs font-bold text-[#04302E] w-8 text-right">{d.score}%</span>
                      </div>
                   ))}
                </div>
                {/* Quote Block */}
                <div className="w-[140px] bg-[#EEF8F7] rounded-[24px] p-5 flex flex-col justify-center relative overflow-hidden shrink-0 border border-[#CFEDED]/50 shadow-inner">
                   <img src={LeavesIllustration} crossOrigin="anonymous" alt="Decoration" className="absolute -bottom-8 -right-8 w-40 h-40 object-contain opacity-30" />
                   <span className="text-5xl text-[#09A3A3] font-serif absolute top-4 left-3 opacity-40">"</span>
                   <p className="text-[15px] font-['Sora'] font-semibold text-[#04302E] relative z-10 leading-snug mt-6">
                     A unique blend of traits that makes you, <br/><span className="text-[#09A3A3] text-lg block mt-1">YOU.</span>
                   </p>
                </div>
             </div>

             {/* Legend */}
             <div className="grid grid-cols-3 gap-y-3 gap-x-2 mt-10 border-t border-gray-100 pt-6">
               {dynamicRIASEC.map((d) => (
                  <div key={d.key} className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                     <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                     {d.label}
                  </div>
               ))}
             </div>
          </div>

          {/* Right: Top Careers */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-[32px] p-8 border border-gray-200/50 shadow-sm flex flex-col">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h2 className="text-[22px] font-['Sora'] font-bold text-[#04302E] mb-1">Top Career Matches</h2>
                 <p className="text-sm text-gray-500 font-medium">Based on your RIASEC profile</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
               {dynamicCareers.slice(0, 6).map((c) => {
                 const Icon = c.icon;
                 return (
                   <button 
                      key={c.rank} 
                      onClick={() => setSelectedCareer(c)} 
                      className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-[#09A3A3]/30 transition-all text-left flex items-start gap-4 cursor-pointer group"
                   >
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: c.color }}>
                        <Icon className="w-6 h-6" strokeWidth={2.5} />
                     </div>
                     <div className="flex-1 min-w-0 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold tracking-wider mb-1 block uppercase">#{c.rank} Match</span>
                        <h3 className="text-[15px] font-bold text-[#04302E] leading-tight mb-2 truncate group-hover:text-[#09A3A3] transition-colors">{c.title}</h3>
                        <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">— {c.stream}</div>
                     </div>
                     <div className="text-sm font-bold text-[#04302E] mt-1">{c.match}%</div>
                   </button>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Section 3: Holistic Profile */}
        <div className="mb-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 px-2">
              <div>
                 <h2 className="text-[22px] font-['Sora'] font-bold text-[#04302E] mb-1">Your Holistic Profile</h2>
                 <p className="text-sm text-gray-500 font-medium">More than just careers - a deeper understanding of you.</p>
              </div>
              <div className="text-xs text-gray-400 font-medium mt-2 md:mt-0">Mind. Body. Soul. A stronger you.</div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mind */}
              <div className="bg-gradient-to-br from-[#F0FDF8] to-[#E6F4F1] rounded-[32px] p-8 border border-[#CCFBF1] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 z-10 relative">
                   <Brain className="w-7 h-7 text-teal-500" />
                 </div>
                 <h3 className="text-xl font-bold text-teal-900 mb-3 z-10 relative">Mind Profile</h3>
                 <p className="text-[13px] text-teal-800/80 mb-10 min-h-[60px] leading-relaxed font-medium z-10 relative">{t.mindText}</p>
                 <div className="flex items-center gap-2 z-10 relative">
                   <span className="w-2.5 h-2.5 rounded-full bg-teal-500"/>
                   <span className="text-[11px] font-semibold text-teal-700">Key trait indicator</span>
                 </div>
                 <div className="absolute -bottom-8 -right-8 opacity-[0.07] group-hover:scale-110 transition-transform duration-500"><Brain className="w-48 h-48 text-teal-700" /></div>
              </div>
              
              {/* Body */}
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF9C3] rounded-[32px] p-8 border border-[#FEF3C7] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 z-10 relative">
                   <GraduationCap className="w-7 h-7 text-amber-500" />
                 </div>
                 <h3 className="text-xl font-bold text-amber-900 mb-3 z-10 relative">Body Profile</h3>
                 <p className="text-[13px] text-amber-800/80 mb-10 min-h-[60px] leading-relaxed font-medium z-10 relative">{t.bodyText}</p>
                 <div className="flex items-center gap-2 z-10 relative">
                   <span className="w-2.5 h-2.5 rounded-full bg-amber-500"/>
                   <span className="text-[11px] font-semibold text-amber-700">Key trait indicator</span>
                 </div>
                 <div className="absolute -bottom-8 -right-8 opacity-[0.07] group-hover:scale-110 transition-transform duration-500"><GraduationCap className="w-48 h-48 text-amber-700" /></div>
              </div>

              {/* Soul */}
              <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-[32px] p-8 border border-[#E9D5FF] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 z-10 relative">
                   <Heart className="w-7 h-7 text-purple-500" />
                 </div>
                 <h3 className="text-xl font-bold text-purple-900 mb-3 z-10 relative">Soul Profile</h3>
                 <p className="text-[13px] text-purple-800/80 mb-10 min-h-[60px] leading-relaxed font-medium z-10 relative">{t.soulText}</p>
                 <div className="flex items-center gap-2 z-10 relative">
                   <span className="w-2.5 h-2.5 rounded-full bg-purple-500"/>
                   <span className="text-[11px] font-semibold text-purple-700">Key trait indicator</span>
                 </div>
                 <div className="absolute -bottom-8 -right-8 opacity-[0.07] group-hover:scale-110 transition-transform duration-500"><Heart className="w-48 h-48 text-purple-700" /></div>
              </div>
           </div>
        </div>

        {/* Section 4: Footer Banner */}
        <div className="bg-gradient-to-r from-[#04302E] to-[#064e4a] rounded-[32px] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-lg mt-12">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#09A3A3]/20 to-transparent pointer-events-none rounded-r-[32px]" />
           
           {/* Left */}
           <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm tracking-wide">SkillSense</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-['Sora'] font-bold text-white mb-5 leading-tight">
                Turning Potential<br/><span className="text-[#E8B04B]">Into Possibilities</span>
              </h2>
              <p className="text-white/70 text-sm max-w-[240px] leading-relaxed">
                Every insight brings you closer to a brighter future.
              </p>
           </div>

           {/* Middle grid */}
           <div className="grid grid-cols-2 gap-4 relative z-10 w-full max-w-[420px]">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[20px] hover:bg-white/20 transition-colors cursor-default">
                 <div className="w-12 h-12 rounded-full bg-[#09A3A3]/20 flex items-center justify-center text-[#09A3A3] shrink-0"><Target className="w-6 h-6"/></div>
                 <div>
                    <div className="text-white text-sm font-bold mb-1">Discover</div>
                    <div className="text-white/60 text-[10px] leading-snug">Understand your<br/>unique strengths</div>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[20px] hover:bg-white/20 transition-colors cursor-default">
                 <div className="w-12 h-12 rounded-full bg-[#E8B04B]/20 flex items-center justify-center text-[#E8B04B] shrink-0"><Compass className="w-6 h-6"/></div>
                 <div>
                    <div className="text-white text-sm font-bold mb-1">Explore</div>
                    <div className="text-white/60 text-[10px] leading-snug">Find career paths<br/>that fit you</div>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[20px] hover:bg-white/20 transition-colors cursor-default">
                 <div className="w-12 h-12 rounded-full bg-[#6D5AE0]/20 flex items-center justify-center text-[#6D5AE0] shrink-0"><TrendingUp className="w-6 h-6"/></div>
                 <div>
                    <div className="text-white text-sm font-bold mb-1">Grow</div>
                    <div className="text-white/60 text-[10px] leading-snug">Build skills for<br/>a brighter tomorrow</div>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[20px] hover:bg-white/20 transition-colors cursor-default">
                 <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0"><Star className="w-6 h-6"/></div>
                 <div>
                    <div className="text-white text-sm font-bold mb-1">Belong</div>
                    <div className="text-white/60 text-[10px] leading-snug">Create a future<br/>that excites you</div>
                 </div>
              </div>
           </div>

           {/* Right Illustration Placeholder */}
           <div className="flex-1 hidden xl:flex justify-end relative z-10">
              <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center text-center p-6 border-4 border-white/10 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#09A3A3]/40 to-[#6D5AE0]/40 backdrop-blur-sm" />
                 <span className="text-[#E8B04B] font-['Sora'] italic text-3xl mb-2 rotate-[-10deg] relative z-10 drop-shadow-lg">A<br/>Brighter<br/>Tomorrow</span>
                 <Sparkles className="absolute top-8 right-8 text-white w-6 h-6 opacity-50" />
                 <Sparkles className="absolute bottom-12 left-10 text-white w-4 h-4 opacity-50" />
              </div>
           </div>
        </div>

        {/* Bottom-most footer text */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 px-6 border-t border-gray-200/60 pt-8 pb-12 gap-4">
           <div className="flex items-center gap-2 opacity-60">
              <Sparkles className="w-5 h-5 text-[#04302E]" />
              <span className="text-[#04302E] font-bold text-sm tracking-wide">SkillSense</span>
              <span className="text-xs text-gray-500 font-medium ml-2 border-l border-gray-300 pl-2">Know Yourself. Build Your Tomorrow.</span>
           </div>
           <div className="text-gray-500 italic text-[15px] font-serif font-medium">
              "Self knowledge is the beginning of all success."
           </div>
           <div className="text-xs text-gray-400 text-right font-medium">
              Keep Exploring.<br/>Greater Futures Await.
           </div>
        </div>

        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedCareer && (
            <CareerDetailModal
              career={selectedCareer}
              onClose={() => setSelectedCareer(null)}
            />
          )}
        </AnimatePresence>

        {/* ---- Locked overlay ---- */}
        {!isPurchased && (
          <div className="absolute inset-0 z-30 flex justify-center items-center px-4 bg-white/40 backdrop-blur-[3px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-[420px] bg-white rounded-[16px] shadow-[0_30px_80px_rgba(4,48,46,0.2)] border border-black/5 text-center p-8 sm:p-9"
            >
              <div
                className="w-14 h-14 rounded-[10px] flex items-center justify-center mx-auto mb-5 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${DEEP}, ${TEAL})` }}
              >
                <Lock className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>

              <span className="text-[11px] font-bold" style={{ color: GOLD }}>Assessment complete</span>

              <h2 className="text-2xl font-bold mt-1.5 mb-2" style={{ color: INK, fontFamily: "'Sora', sans-serif" }}>
                Unlock {fullName}'s report
              </h2>

              {/* Guest user: show account creation CTA */}
              {!currentUser && (
                <>
                  <p className="text-sm text-gray-500 max-w-[320px] mx-auto mb-6 leading-relaxed">
                    Create a free account to see the full trait analysis, subject recommendations, and career roadmap.
                  </p>
                  <button
                    type="button"
                    onClick={onCreateAccount}
                    className="w-full py-4 rounded-[12px] text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer hover:shadow-xl"
                    style={{ background: `linear-gradient(90deg, ${DEEP}, ${TEAL})` }}
                  >
                    Create account to unlock
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: TEAL }} />
                    Instant access \u00b7 100% free signup
                  </p>
                </>
              )}

              {/* Logged-in user: show unlock or purchase CTA */}
              {currentUser && (
                <>
                  <p className="text-sm text-gray-500 max-w-[320px] mx-auto mb-4 leading-relaxed">
                    Use 1 assessment credit to unlock the full trait analysis, subject recommendations, and career roadmap.
                  </p>
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 mb-5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    <span>Available Balance:</span>
                    <span className="font-bold">{currentUser?.balance ?? 0} {(currentUser?.balance ?? 0) === 1 ? 'Credit' : 'Credits'}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {(currentUser?.balance ?? 0) >= 1 ? (
                      <>
                        {onUnlockReport && (
                          <button
                            type="button"
                            onClick={onUnlockReport}
                            className="w-full py-4 rounded-[12px] text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer hover:shadow-xl"
                            style={{ background: `linear-gradient(90deg, ${DEEP}, ${TEAL})` }}
                          >
                            Unlock with 1 Credit
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onGoToPricing && (
                          <button
                            type="button"
                            onClick={onGoToPricing}
                            className="w-full py-4 rounded-[12px] text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer hover:shadow-xl"
                            style={{ background: `linear-gradient(90deg, ${DEEP}, ${TEAL})` }}
                          >
                            Buy Credits to Unlock
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: TEAL }} />
                    Secure \u00b7 Credits never expire
                  </p>
                </>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}