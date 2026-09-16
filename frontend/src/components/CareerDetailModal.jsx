import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../translations/LanguageContext';
import {
  X, Briefcase, GraduationCap, DollarSign, BookOpen,
  MapPin, Building, Trophy, TrendingUp, Sparkles, Brain, Landmark, UserCheck, Loader2
} from 'lucide-react';

const DEEP = '#04302E';
const TEAL = '#09A3A3';
const PURPLE = '#6D5AE0';
const GOLD = '#E8B04B';

export default function CareerDetailModal({ career, onClose }) {
  const [enrichedRaw, setEnrichedRaw] = useState(career?.rawData || {});
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    if (!career || !career.title) return;
    
    // Check if we need to fetch enriched data
    if (career.rawData?.skill_development_plan) {
      setEnrichedRaw(career.rawData);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/career-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career_name: career.title, language: language })
        });
        const data = await response.json();
        if (data && data.career) {
          setEnrichedRaw(data.career);
        }
      } catch (err) {
        console.error("Failed to fetch enriched career details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [career]);

  if (!career) return null;

  const raw = enrichedRaw;

  // Extract / Normalize fields
  const description = raw.description || career.description || '';
  const reason = career.reason || '';
  
  // Educational Pathway
  let eduSteps = [];
  if (raw.educational_pathway?.steps) {
    eduSteps = raw.educational_pathway.steps;
  } else if (Array.isArray(raw.educational_pathway)) {
    eduSteps = raw.educational_pathway;
  }

  // Course Fee
  const courseFeeStr = career.fee || raw.course_fee?.fee_range || '';
  const minFee = raw.course_fee?.minimum_inr;
  const maxFee = raw.course_fee?.maximum_inr;

  // Expected Income
  const incomeStr = career.salary || raw.expected_income?.fresher_salary || '';
  const minInc = raw.expected_income?.minimum_monthly_salary;
  const maxInc = raw.expected_income?.maximum_monthly_salary;

  // Scholarships & Loans
  const scholarships = raw.scholarships;
  const loans = raw.loans;

  // Institutes
  const govInstitutes = raw.where_will_you_study?.government_institutes || [];
  const pvtInstitutes = raw.where_will_you_study?.private_institutes || [];
  const distLearning = raw.where_will_you_study?.distance_learning || [];

  // Work Environment
  const placesOfWork = raw.where_will_you_work?.places_of_work || [];
  const workEnv = raw.where_will_you_work?.work_environment?.description || raw.where_will_you_work?.work_environment || '';

  // Growth Path
  const growthPath = career.growthPath || raw.growth_path || '';
  const growthSteps = Array.isArray(growthPath) ? growthPath : growthPath.split('→').map(s => s.trim()).filter(Boolean);

  // Skill Development Plan
  const skillPlan = raw.skill_development_plan || '';

  // Success Story
  const successStory = raw.success_story || raw.example_from_field || null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04211F]/70 backdrop-blur-sm sm:p-6 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{ backgroundColor: career.color }}
            >
              <career.icon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: career.color }}>
                {career.match}% Match
              </span>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight mt-0.5" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                {career.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-10">
          
          {/* Section 1: Overview */}
          <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                  <Briefcase className="w-5 h-5" style={{ color: TEAL }} />
                  Career Overview
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {description || "No overview available."}
                </p>
              </section>

          {/* Section 2: Why it matches */}
          {(reason || career.traits) && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <UserCheck className="w-5 h-5" style={{ color: PURPLE }} />
                Why It Matches Student Profile
              </h3>
              <div className="bg-[#F2EFFE] p-4 sm:p-5 rounded-xl border border-[#7C5CFC]/20 text-sm text-gray-700 leading-relaxed">
                {reason && <p className="mb-3">{reason}</p>}
                {career.traits && (
                  <div>
                    <strong className="text-[#6245d6] block mb-1">Personality Traits Alignment:</strong>
                    <ul className="list-disc pl-5 space-y-1">
                      {career.traits.split(',').map((trait, i) => (
                        <li key={i}>{trait.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Skill Development Plan */}
          <section className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
                Skill Development Plan
              </h3>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {skillPlan ? (
              <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 sm:p-6 text-sm text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                {skillPlan}
              </div>
            ) : (
              <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 sm:p-6 text-sm text-gray-400 italic">
                {isLoading ? "Generating your personalized skill plan..." : "No specific skill plan available for this career."}
              </div>
            )}
          </section>

          {/* Section 3: Educational Pathway */}
          {eduSteps.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <GraduationCap className="w-5 h-5" style={{ color: GOLD }} />
                Educational Pathway
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 w-16 text-center">Step</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Requirement / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eduSteps.map((step, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-700 leading-relaxed">
                          {typeof step === 'string' ? step : (
                            <>
                              {step.title && <strong className="block text-gray-900 mb-0.5">{step.title}</strong>}
                              <span className="text-sm">{step.description || step.details || ''}</span>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 4: Financials (Fees & Income) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <BookOpen className="w-5 h-5 text-red-500" />
                Course Fees
              </h3>
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 h-full">
                {courseFeeStr && (
                  <p className="font-bold text-red-700 text-lg mb-2">{courseFeeStr}</p>
                )}
                {(minFee || maxFee) && (
                  <ul className="text-sm text-gray-600 space-y-2 mt-3">
                    {minFee && <li className="flex justify-between border-b border-red-100/50 pb-1"><span>Minimum:</span> <span className="font-medium text-gray-800">₹{minFee.toLocaleString()}</span></li>}
                    {maxFee && <li className="flex justify-between border-b border-red-100/50 pb-1"><span>Maximum:</span> <span className="font-medium text-gray-800">₹{maxFee.toLocaleString()}</span></li>}
                  </ul>
                )}
                <p className="text-[10px] text-gray-400 mt-4 leading-tight italic">
                  (These figures are estimated numbers and will vary from institute to institute.)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <DollarSign className="w-5 h-5 text-green-500" />
                Expected Income
              </h3>
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-5 h-full">
                <p className="font-bold text-green-700 text-lg mb-2">{incomeStr}</p>
                {(minInc || maxInc) && (
                  <ul className="text-sm text-gray-600 space-y-2 mt-3">
                    {minInc && <li className="flex justify-between border-b border-green-100/50 pb-1"><span>Starting Salary:</span> <span className="font-medium text-gray-800">{minInc}</span></li>}
                    {maxInc && <li className="flex justify-between border-b border-green-100/50 pb-1"><span>Peak Salary:</span> <span className="font-medium text-gray-800">{maxInc}</span></li>}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Section 5 & 6: Scholarships and Loans */}
          {(scholarships || loans) && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <Landmark className="w-5 h-5 text-indigo-500" />
                Financial Assistance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scholarships && (
                  <div className="border border-gray-100 rounded-xl p-4 bg-indigo-50/30">
                    <h4 className="font-bold text-base mb-3 text-indigo-800">Scholarships</h4>
                    {Array.isArray(scholarships) ? (
                      <ul className="space-y-4">
                        {scholarships.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 leading-relaxed">
                            {typeof item === 'string' ? item : (
                              <>
                                {item.name && <strong className="block text-gray-800 mb-0.5">{item.name}</strong>}
                                <span>{item.description || item.details}</span>
                                {item.website && <a href={item.website} target="_blank" rel="noreferrer" className="text-indigo-600 ml-1 hover:underline">Link</a>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{scholarships}</p>
                    )}
                  </div>
                )}
                {loans && (
                  <div className="border border-gray-100 rounded-xl p-4 bg-indigo-50/30">
                    <h4 className="font-bold text-base mb-3 text-indigo-800">Loans</h4>
                    {Array.isArray(loans) ? (
                      <ul className="space-y-4">
                        {loans.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 leading-relaxed">
                            {typeof item === 'string' ? item : (
                              <>
                                {item.name && <strong className="block text-gray-800 mb-0.5">{item.name}</strong>}
                                <span>{item.description || item.details}</span>
                                {item.website && <a href={item.website} target="_blank" rel="noreferrer" className="text-indigo-600 ml-1 hover:underline">Link</a>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{loans}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 6: Where Will You Study */}
          {(govInstitutes.length > 0 || pvtInstitutes.length > 0) && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <Building className="w-5 h-5" style={{ color: TEAL }} />
                Where Will You Study?
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 w-1/3">Type</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Institutes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {govInstitutes.length > 0 && (
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 align-top font-medium text-gray-700">🏛️ Government</td>
                        <td className="px-4 py-3">
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            {govInstitutes.map((inst, i) => <li key={i}>{typeof inst === 'string' ? inst : inst.name || JSON.stringify(inst)}</li>)}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {pvtInstitutes.length > 0 && (
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 align-top font-medium text-gray-700">🏢 Private</td>
                        <td className="px-4 py-3">
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            {pvtInstitutes.map((inst, i) => <li key={i}>{typeof inst === 'string' ? inst : inst.name || JSON.stringify(inst)}</li>)}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {distLearning.length > 0 && (
                      <tr>
                        <td className="px-4 py-3 align-top font-medium text-gray-700">🌐 Distance Learning</td>
                        <td className="px-4 py-3">
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            {distLearning.map((inst, i) => <li key={i}>{typeof inst === 'string' ? inst : inst.name || JSON.stringify(inst)}</li>)}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 7: Where Will You Work */}
          {(placesOfWork.length > 0 || workEnv) && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <MapPin className="w-5 h-5 text-orange-500" />
                Where Will You Work?
              </h3>
              <div className="bg-[#FFF7EA] border border-[#E8B04B]/30 rounded-xl p-5 text-sm text-gray-700 leading-relaxed">
                {workEnv && <p className="mb-4">{workEnv}</p>}
                {placesOfWork.length > 0 && (
                  <div>
                    <strong className="text-[#b5730b] block mb-2">Common Places of Work:</strong>
                    <div className="flex flex-wrap gap-2">
                      {placesOfWork.map((place, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-[#E8B04B]/30 rounded-full text-xs font-medium shadow-sm">
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 11: Expected Growth Path */}
          {growthSteps.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Expected Growth Path
              </h3>
              <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-5 sm:p-6 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {growthSteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="bg-white border border-blue-200 shadow-sm px-4 py-2 rounded-lg text-sm font-medium text-blue-900 text-center flex-1 max-w-[200px] whitespace-normal">
                        {typeof step === 'object' && step !== null ? (step.title || Object.values(step).flat().join(' → ')) : step}
                      </div>
                      {idx < growthSteps.length - 1 && (
                        <div className="text-blue-300 font-bold px-2">➔</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section 13: Example From The Field */}
          {successStory && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DEEP, fontFamily: "'Sora', sans-serif" }}>
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Example From The Field
              </h3>
              <div className="bg-gray-900 text-white p-6 rounded-xl relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <h4 className="text-lg font-bold mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {typeof successStory === 'string' ? 'Professional Example' : (successStory.name || 'Professional Example')}
                </h4>
                {typeof successStory === 'object' && (successStory.current_role || successStory.organization) && (
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                    {successStory.current_role || successStory.organization} {successStory.location ? ` • ${successStory.location}` : ''}
                  </p>
                )}
                <div className="text-sm text-gray-300 leading-relaxed">
                  {typeof successStory === 'string' 
                    ? successStory 
                    : (successStory.career_journey || successStory.achievement || successStory.details || successStory.description || "An inspiring example from this field.")}
                </div>
              </div>
            </section>
          )}

        </div>
      </motion.div>
    </div>
  );
}
