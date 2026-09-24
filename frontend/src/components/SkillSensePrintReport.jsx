import React from 'react';
import {
  Rocket, TrendingUp, Award, Compass, Target,
  Briefcase
} from 'lucide-react';

const ICON_MAP = [Rocket, TrendingUp, Award, Compass, Target, Briefcase];

const BADGE_COLORS = [
  { bg: '#059669', text: '#ffffff' }, // emerald
  { bg: '#D97706', text: '#ffffff' }, // amber
  { bg: '#0284C7', text: '#ffffff' }, // sky blue
  { bg: '#7C3AED', text: '#ffffff' }, // violet
  { bg: '#0D9488', text: '#ffffff' }, // teal
  { bg: '#4F46E5', text: '#ffffff' }  // indigo
];

const SOFT_ICON_COLORS = [
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
  { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' }
];

export default function SkillSensePrintReport({
  refProp,
  user,
  reportData,
  dynamicCareers = [],
  dynamicRIASEC = [],
  personalityCode = 'SCR',
  dateStr
}) {
  const fullName = user?.name || user?.full_name || reportData?.student_profile?.name || reportData?.student_profile?.fullName || 'Swapnil Ingle';
  const studentGrade = user?.class_year || user?.education_level || user?.grade || reportData?.student_profile?.grade || reportData?.student_profile?.classYear || '11th';
  const currentDate = dateStr || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Take top 6 careers
  const topCareers = dynamicCareers.slice(0, 6);
  const topMatchScore = topCareers[0]?.match || 51;

  // Harmonized Trait Colors
  const traitColorPalette = ['#059669', '#0284C7', '#F59E0B', '#06B6D4', '#8B5CF6', '#047857'];
  const sanitizedTraits = dynamicRIASEC.map((item, idx) => ({
    ...item,
    color: traitColorPalette[idx % traitColorPalette.length]
  }));

  // Calculate Donut Segments
  const totalScore = sanitizedTraits.reduce((sum, item) => sum + (item.score || 0), 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const donutSegments = sanitizedTraits.map((item) => {
    const fraction = (item.score || 0) / totalScore;
    const strokeDasharray = `${(fraction * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const strokeDashoffset = (-accumulatedOffset).toFixed(2);
    accumulatedOffset += fraction * circumference;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div ref={refProp} className="skillsense-print-root">
      <div className="skillsense-pdf-document font-sans text-slate-900 bg-white">
        
        {/* ======================= PAGE 1 ======================= */}
        <div className="skillsense-pdf-page page-1-container">
          
          {/* Top Brand Header */}
          <div className="flex justify-between items-center pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#064E3B]">
                SkillSense
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                OFFICIAL REPORT
              </span>
            </div>
            <div className="text-[#D97706] font-serif italic text-base font-bold">
              A Brighter You
            </div>
          </div>

          {/* Student Profile Hero Banner - Deep Emerald Gradient */}
          <div
            className="rounded-2xl p-4 text-white flex justify-between items-center shadow-sm mb-3 border border-emerald-500/20"
            style={{
              background: 'linear-gradient(135deg, #052E26 0%, #084337 50%, #0D5C4C 100%)'
            }}
          >
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white mb-1">
                {fullName}
              </h1>
              <div className="flex items-center gap-3 text-xs text-emerald-200">
                <span className="font-semibold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {studentGrade}
                </span>
                <span className="text-emerald-200/80">
                  Generated: {currentDate}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center pr-2">
              <span className="text-[10.5px] text-emerald-200 font-semibold mb-1 tracking-wider uppercase">
                Personality Code
              </span>
              <div className="w-15 h-15 w-[58px] h-[58px] rounded-full border-2 border-[#10B981] bg-[#02241D] flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-[#34D399] tracking-wider">
                  {personalityCode}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Two-Column Grid: Personality Trait Profile & Top Career Matches */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            
            {/* Left Column: Personality Trait Profile (RIASEC name removed) */}
            <div className="col-span-5 bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-slate-900">
                    Personality Trait Profile
                  </h2>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Core Traits
                  </span>
                </div>
                
                {/* SVG Donut Chart */}
                <div className="relative flex items-center justify-center my-0.5">
                  <svg width="124" height="124" viewBox="0 0 130 130" className="rotate-[-90deg]">
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={seg.key || i}
                        cx="65"
                        cy="65"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {topMatchScore}%
                    </span>
                    <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full uppercase mt-1">
                      Top Fit
                    </span>
                  </div>
                </div>
              </div>

              {/* Trait Legend */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 pt-2 border-t border-slate-100 text-[10px] text-slate-700 font-medium">
                {sanitizedTraits.map((trait) => (
                  <div key={trait.key} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: trait.color }}
                    />
                    <span className="truncate">{trait.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Top Career Matches */}
            <div className="col-span-7 bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold text-slate-900">
                  Top Career Matches
                </h2>
                <span className="text-[9px] font-semibold text-slate-500">
                  Based on Trait Alignment
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {topCareers.map((c, idx) => {
                  const badge = BADGE_COLORS[idx % BADGE_COLORS.length];
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl p-2 bg-[#FAFDFB] flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-full text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded">
                          {c.match}%
                        </span>
                      </div>
                      <div className="text-[10.5px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {c.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Section: Profile Strength Bars */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 mb-2 shadow-sm">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-xs font-bold text-slate-900 leading-tight">
                Profile Breakdown
              </h2>
              <span className="text-[9px] text-slate-500">
                Holistic strength indicators across key domains
              </span>
            </div>
            <p className="text-[9.5px] text-slate-500 mb-2">
              Strength bars represent core cognitive, functional, and interpersonal readiness.
            </p>

            <div className="grid grid-cols-3 gap-4">
              
              {/* Mind */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h3 className="text-[10.5px] font-bold text-slate-900">Mind</h3>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Logical Reasoning</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '88%', background: 'linear-gradient(90deg, #059669 0%, #0D9488 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Analytical Depth</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '82%', background: 'linear-gradient(90deg, #059669 0%, #0D9488 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Problem Solving</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '91%', background: 'linear-gradient(90deg, #059669 0%, #0D9488 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Strategic Focus</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '76%', background: 'linear-gradient(90deg, #059669 0%, #0D9488 100%)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <h3 className="text-[10.5px] font-bold text-slate-900">Body</h3>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Execution & Routine</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '85%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Practical Approach</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '79%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Focus & Discipline</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '88%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Resilience & Stamina</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '84%', background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Soul */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <h3 className="text-[10.5px] font-bold text-slate-900">Soul</h3>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Purpose & Impact</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '92%', background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Leadership Drive</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '86%', background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Empathy & Values</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '89%', background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)' }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-700 font-medium mb-0.5">Team Collaboration</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '83%', background: 'linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-1.5 mt-auto border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <span>Know Yourself. Build Your Tomorrow.</span>
            <span className="font-bold text-xs text-[#064E3B]">SkillSense</span>
          </div>

        </div>

        {/* Page Break */}
        <div className="skillsense-pdf-page-break" />

        {/* ======================= PAGE 2 ======================= */}
        <div className="skillsense-pdf-page page-2-container">
          
          {/* Header */}
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div>
              <h2 className="text-lg font-black text-[#064E3B] tracking-tight">
                Detailed Career Pathways
              </h2>
              <p className="text-[9.5px] text-slate-500">
                Educational pathways, key traits, fee estimates, and income expectations
              </p>
            </div>
            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {topCareers.length} Tailored Recommendations
            </span>
          </div>

          {/* 6 Career Cards - Compact & Optimized to never overflow */}
          <div className="space-y-1.5 flex-1">
            {topCareers.map((c, idx) => {
              const iconStyle = SOFT_ICON_COLORS[idx % SOFT_ICON_COLORS.length];
              const IconComp = ICON_MAP[idx % ICON_MAP.length];
              return (
                <div
                  key={idx}
                  className="border border-slate-200/90 rounded-xl px-2.5 py-1.5 bg-white shadow-sm"
                >
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6.5 h-6.5 w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: iconStyle.bg, color: iconStyle.text, borderColor: iconStyle.border }}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {c.title}
                        </h3>
                        <p className="text-[9px] font-semibold text-emerald-700 leading-tight">
                          {c.stream || 'Engineering & Technology'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-black bg-[#064E3B] text-white px-2 py-0.2 rounded-full shadow-sm">
                      {c.match}% Match
                    </span>
                  </div>

                  {/* Description - 2 lines clean clamp */}
                  <p className="text-[9px] text-slate-600 leading-snug line-clamp-2 mb-1">
                    {c.description}
                  </p>

                  {/* Metrics Grid with Attractive Colored Capsules */}
                  <div className="grid grid-cols-4 gap-1 text-[8.5px] mb-1">
                    {/* Education Path */}
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded-md flex flex-col justify-between">
                      <span className="block text-[#1D4ED8] font-bold text-[7.5px] uppercase tracking-wider">
                        Education Path
                      </span>
                      <span className="font-bold text-[#1E3A8A] leading-tight text-[8.5px] line-clamp-2">
                        {c.educationPath || c.stream || '10+2 \u2192 Degree Course'}
                      </span>
                    </div>

                    {/* Key Traits */}
                    <div className="bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.5 rounded-md flex flex-col justify-between">
                      <span className="block text-[#15803D] font-bold text-[7.5px] uppercase tracking-wider">
                        Key Traits
                      </span>
                      <span className="font-semibold text-[#14532D] leading-tight text-[8.5px] line-clamp-2">
                        {c.traits || 'Analytical, Logical Reasoning'}
                      </span>
                    </div>

                    {/* Expected Salary */}
                    <div className="bg-[#FAF5FF] border border-[#E9D5FF] px-1.5 py-0.5 rounded-md flex flex-col justify-between">
                      <span className="block text-[#7E22CE] font-bold text-[7.5px] uppercase tracking-wider">
                        Expected Salary
                      </span>
                      <span className="font-bold text-[#581C87] leading-tight text-[8.5px] line-clamp-2">
                        {c.salary || '\u20B925,000 \u2013 \u20B980,000 / mo'}
                      </span>
                    </div>

                    {/* Course Fees */}
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] px-1.5 py-0.5 rounded-md flex flex-col justify-between">
                      <span className="block text-[#B45309] font-bold text-[7.5px] uppercase tracking-wider">
                        Course Fees
                      </span>
                      <span className="font-bold text-[#78350F] leading-tight text-[8.5px] line-clamp-2">
                        {c.fee || '\u20B950,000 \u2013 \u20B92,00,000'}
                      </span>
                    </div>
                  </div>

                  {/* Growth Path */}
                  {c.growthPath && !c.growthPath.includes('[object') && (
                    <div className="text-[8.5px] bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded flex items-center gap-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[7.5px] shrink-0">
                        Career Path:
                      </span>
                      <span className="text-slate-800 font-medium truncate">
                        {c.growthPath}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Page 2 Footer */}
          <div className="pt-1.5 mt-auto border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <span>Know Yourself. Build Your Tomorrow.</span>
            <span className="font-bold text-xs text-[#064E3B]">SkillSense</span>
          </div>

        </div>

      </div>
    </div>
  );
}
