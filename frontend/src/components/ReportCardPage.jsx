import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, ArrowRight, ShieldCheck,
  Brain, Heart, GraduationCap, Trophy,
  Rocket, TrendingUp, Award, Target,
  Sparkles, Info, X, DollarSign, BookOpen,
  Briefcase, ChevronRight, Compass, Download,
} from 'lucide-react';
import CareerDetailModal from './CareerDetailModal';

import Graphic1 from '../assets/graphics/graphic-1.png';

/* ------------------------------------------------------------------ */
/*  Palette — brand teal/gold family, purple added as the one bold    */
/*  accent (used only on the hero chart + rank #1, everywhere else    */
/*  stays quiet).                                                     */
/* ------------------------------------------------------------------ */
const DEEP = '#04302E';
const TEAL = '#09A3A3';
const TEAL_LIGHT = '#CFEDED';
const GOLD = '#E8B04B';
const PURPLE = '#6D5AE0';
const INK = '#0B2422';
const BG = '#F6FBFA';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Bar Graph Component                                               */
/* ------------------------------------------------------------------ */
function BarGraph({ data }) {
  const maxScore = Math.max(...data.map(d => d.score));
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
          Trait Profile
        </h2>
        <span className="text-[11px] text-gray-400 font-medium">RIASEC model</span>
      </div>
      
      <div className="space-y-3">
        {data.map((d, index) => (
          <motion.div
            key={d.key}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            <span className="text-[11px] font-semibold w-16 text-right text-gray-500 shrink-0">
              {d.label}
            </span>
            
            <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-lg"
                style={{ backgroundColor: d.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(d.score / maxScore) * 100}%` }}
                transition={{ delay: index * 0.08, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            
            <span className="text-[11px] font-bold w-8 text-right" style={{ color: DEEP }}>
              {d.score}%
            </span>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ambient background                                                */
/* ------------------------------------------------------------------ */
function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] bg-[#09A3A3]/10 rounded-full blur-[110px]" />
      <div className="absolute bottom-[-80px] right-[-40px] w-[440px] h-[440px] bg-[#6D5AE0]/10 rounded-full blur-[120px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ReportCardPage({ isPurchased = false, onCreateAccount, user = null, reportData = null }) {
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showEcrTooltip, setShowEcrTooltip] = useState(false);
  const [defaultCareers, setDefaultCareers] = useState(null);
  const [defaultRIASEC, setDefaultRIASEC] = useState(null);
  
  useEffect(() => {
    // If we don't have reportData from a completed test, fetch dynamic defaults from Data.json (backend)
    if (!reportData) {
      fetch('/api/all-careers')
        .then(res => res.json())
        .then(data => {
          if (data && data.careers) {
            // Select 6 default careers to show as a fallback placeholder
            const placeholderCareers = data.careers.slice(0, 6).map((c, idx) => {
              const minSalary = c.expected_income?.minimum_monthly_salary || '';
              const maxSalary = c.expected_income?.maximum_monthly_salary || '';
              const salaryStr = (minSalary && maxSalary) ? `${minSalary} – ${maxSalary} / mo` : (minSalary || maxSalary || '₹1,50,000 – ₹3,00,000 / mo');
              
              const feeInfo = c.course_fee?.estimated_total_fee || c.course_fee?.fee_range || '₹50,000 – ₹2,00,000';
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
                match: 95 - idx * 3, // Dummy match score for placeholders
                salary: salaryStr,
                fee: feeInfo,
                description: c.description || '',
                traits: traits,
                growthPath: growthPath,
                icon: [Rocket, TrendingUp, Award, Compass, Target, Briefcase][idx % 6],
                color: [PURPLE, TEAL, GOLD, '#2E86AB', TEAL, PURPLE][idx % 6],
              };
            });
            setDefaultCareers(placeholderCareers);
            
            // Dummy RIASEC for fallback display
            setDefaultRIASEC([
              { key: 'R', label: 'Realistic', score: 65, color: '#5C8374' },
              { key: 'I', label: 'Investigative', score: 78, color: '#2E86AB' },
              { key: 'A', label: 'Artistic', score: 70, color: GOLD },
              { key: 'S', label: 'Social', score: 85, color: TEAL },
              { key: 'E', label: 'Enterprising', score: 94, color: PURPLE },
              { key: 'C', label: 'Conventional', score: 82, color: DEEP },
            ]);
          }
        })
        .catch(err => console.error("Failed to load placeholder careers from backend:", err));
    }
  }, [reportData]);

  // Dynamic RIASEC Scores
  const dynamicRIASEC = reportData?.scores ? [
    { key: 'R', label: 'Realistic', score: Math.round((reportData.scores['R'] / 35) * 100), color: '#5C8374' },
    { key: 'I', label: 'Investigative', score: Math.round((reportData.scores['I'] / 35) * 100), color: '#2E86AB' },
    { key: 'A', label: 'Artistic', score: Math.round((reportData.scores['A'] / 35) * 100), color: GOLD },
    { key: 'S', label: 'Social', score: Math.round((reportData.scores['S'] / 35) * 100), color: TEAL },
    { key: 'E', label: 'Enterprising', score: Math.round((reportData.scores['E'] / 35) * 100), color: PURPLE },
    { key: 'C', label: 'Conventional', score: Math.round((reportData.scores['C'] / 35) * 100), color: DEEP },
  ] : defaultRIASEC;

  // Calculate 3-letter personality code
  const personalityCode = reportData?.scores ? 
    Object.entries(reportData.scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0])
      .join('') 
    : 'ECR';

  // Dynamic Careers
  const dynamicCareers = reportData?.top_careers ? reportData.top_careers.map((c, idx) => {
    const minSalary = c.data?.expected_income?.minimum_monthly_salary || '';
    const maxSalary = c.data?.expected_income?.maximum_monthly_salary || '';
    const salaryStr = (minSalary && maxSalary) ? `${minSalary} – ${maxSalary} / mo` : (minSalary || maxSalary || '₹1,50,000 – ₹3,00,000 / mo');
    
    const feeInfo = c.data?.course_fee?.estimated_total_fee || c.data?.course_fee?.fee_range || '₹50,000 – ₹2,00,000';
    let streamInfo = 'Any Stream';
    if (c.data?.educational_pathway && c.data.educational_pathway.length > 0) {
        streamInfo = c.data.educational_pathway[0]?.stream || c.data.educational_pathway[0]?.degree || 'Any Stream';
    }

    const traits = c.data?.personality_traits?.join(', ') || c.data?.personality_traits || 'Problem solving, logical reasoning';
    const growthPath = Array.isArray(c.data?.growth_path) ? c.data.growth_path.join(' → ') : (c.data?.growth_path || 'Junior → Senior → Lead');

    return {
      rank: idx + 1,
      title: c.name,
      stream: streamInfo,
      match: Math.round(c.match_score),
      salary: salaryStr,
      fee: feeInfo,
      description: c.data?.description || c.reason || '',
      traits: traits,
      growthPath: growthPath,
      icon: [Rocket, TrendingUp, Award, Compass, Target, Briefcase][idx % 6],
      color: [PURPLE, TEAL, GOLD, '#2E86AB', TEAL, PURPLE][idx % 6],
      rawData: c.data || c,
      reason: c.reason || c.data?.reason || ''
    };
  }) : defaultCareers;

  if (!dynamicCareers || !dynamicRIASEC) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#CFEDED]">
        <div className="animate-spin w-8 h-8 border-4 border-[#09A3A3] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const fullName = user?.name || 'Student';
  const studentName = fullName.split(' ')[0];
  const studentGrade = user?.grade || '';
  const topMatch = dynamicCareers[0];
  
  // Get profile photo from user or use default
  const profilePhoto = user?.profilePhoto || null;

  // Download Report Function
  const handleDownloadReport = () => {
    // In a real app, this would generate a PDF
    // For now, we'll show a success message and download a sample
    alert('📄 Your report is being prepared for download...');
    
    // You can replace this with actual PDF generation logic
    // Example: window.print() for print version
    // Or use libraries like jsPDF, html2canvas, etc.
    console.log('Downloading report for:', fullName);
  };

  return (
    <div className="min-h-screen w-full py-8 sm:py-12 px-4 sm:px-8 md:px-10 flex justify-center relative" style={{ backgroundColor: BG }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`max-w-5xl w-full bg-white rounded-[16px] shadow-[0_30px_80px_rgba(4,48,46,0.15)] border border-black/5 relative overflow-hidden ${!isPurchased ? 'max-h-[92vh]' : ''}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >

        <div className={`transition-all duration-500 ${!isPurchased ? 'blur-[6px] select-none pointer-events-none opacity-70' : ''}`}>

          {/* ---- Header band with profile photo and download button ---- */}
          <div className="px-6 sm:px-10 md:px-12 py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ backgroundColor: DEEP }}>
            <div className="flex items-center gap-5">
              {/* Profile Photo / Avatar */}
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={fullName}
                  className="w-16 h-16 rounded-[10px] object-cover shadow-lg border-2 border-white/20"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-[10px] flex items-center justify-center text-xl font-extrabold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, ${PURPLE})`, fontFamily: "'Sora', sans-serif" }}
                >
                  {fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {studentName}
                </h1>
                <p className="text-[13px] text-white/70 font-medium">
                  {studentGrade ? `${studentGrade} · ` : ''}Career readiness report
                </p>
              </div>
            </div>

            {/* Download Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 hover:border-white/40 shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-semibold">Download Report</span>
            </motion.button>
          </div>

          {/* ---- Stat strip ---- */}
          <div className="px-6 sm:px-10 md:px-12 py-6 flex flex-wrap items-center justify-end gap-4 border-b border-black/5">
            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-teal-500/10">
                <Target className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Aptitude match</p>
                <p className="text-lg font-extrabold" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>96%</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-default">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-purple-500/10">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Top personality</p>
                  <div className="flex items-center gap-1.5 justify-center">
                    <p className="text-[19px] font-bold tracking-tight" style={{ color: PURPLE, fontFamily: "'Sora', sans-serif" }}>
                      {personalityCode}
                    </p>
                    <button 
                      onMouseEnter={() => setShowEcrTooltip(true)}
                      onMouseLeave={() => setShowEcrTooltip(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tooltip */}
              <AnimatePresence>
                {showEcrTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    className="absolute top-[110%] right-0 w-[220px] bg-gray-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl z-20"
                  >
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
                    <strong>{personalityCode} Profile</strong><br/>
                    Based on your top 3 traits from the RIASEC model. It means your work style is deeply aligned with these characteristics.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-amber-500/10">
                <Compass className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Career paths mapped</p>
                <p className="text-lg font-extrabold" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>6</p>
              </div>
            </div>
          </div>

          {/* ---- Hero section: bar graph + career cards ---- */}
          <div className="px-6 sm:px-10 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Bar Graph - Left */}
            <div className="md:col-span-5 border border-gray-100 rounded-xl p-5 bg-white relative">
              <BarGraph data={dynamicRIASEC} />
            </div>

            {/* Career Cards - Right */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                  Top Career Matches
                </h2>
                <span className="text-[11px] text-gray-400">Tap a card for details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {dynamicCareers.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.rank}
                      onClick={() => setSelectedCareer(c)}
                      className="p-4 rounded-[10px] hover:shadow-lg transition-all text-left cursor-pointer group border border-black/5 hover:border-black/10 bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md"
                          style={{ backgroundColor: c.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: INK }}>{c.title}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${c.match}%`, backgroundColor: c.color }} />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 shrink-0">{c.match}%</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] text-gray-400 font-medium">#{c.rank}</span>
                            <span className="text-[9px] text-gray-400">·</span>
                            <span className="text-[9px] text-gray-400 truncate">{c.stream}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---- Mind / Body / Soul - Larger & Colorful ---- */}
          <div className="px-6 sm:px-10 md:px-12 pb-10 pt-8 border-t border-black/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Brain, 
                  label: 'Mind', 
                  text: 'Leadership and persuasive traits dominate your analytical thinking.', 
                  color: TEAL,
                  gradient: 'from-teal-400 to-teal-600'
                },
                { 
                  icon: GraduationCap, 
                  label: 'Body', 
                  text: 'You do best in environments that are structured and well organized.', 
                  color: GOLD,
                  gradient: 'from-amber-400 to-amber-600'
                },
                { 
                  icon: Heart, 
                  label: 'Soul', 
                  text: 'Driven by impact, leadership, and meaningful professional connection.', 
                  color: PURPLE,
                  gradient: 'from-purple-400 to-purple-600'
                },
              ].map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={i}
                    className="p-6 rounded-[12px] shadow-lg hover:shadow-xl transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${p.color}15, ${p.color}05)`,
                      border: `1px solid ${p.color}30`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-14 h-14 rounded-[10px] flex items-center justify-center shrink-0 shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${p.color}, ${p.color}CC)`,
                        }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold mb-1.5" style={{ color: p.color, fontFamily: "'Sora', sans-serif" }}>
                          {p.label} Profile
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-[10px] font-medium text-gray-400">Key trait indicator</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Career detail modal ---- */}
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
                Instant access · 100% free signup
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}