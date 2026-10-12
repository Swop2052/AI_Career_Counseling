import React from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, Landmark, LineChart, Sparkles, ShieldCheck } from 'lucide-react';
import SeoHead from '../common/SeoHead';

export default function CommerceCareerTest({ onStartTest }) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://skillsense.aisense.co.in/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Career Test for Commerce Students",
          "item": "https://skillsense.aisense.co.in/career-test-for-commerce-students"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Which are the highest paying careers for commerce students in India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The top-paying commerce careers include Chartered Accountancy (CA), Investment Banking, Corporate Law, Management Consulting, Actuarial Science, and FinTech Product Management, with senior salaries ranging from ₹15-50+ LPA."
          }
        },
        {
          "@type": "Question",
          "name": "Can I do well in Commerce without Mathematics in 11th and 12th?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Courses like B.Com (General), BBA, Law (BA LLB), Digital Marketing, Graphic Design, and Company Secretary (CS) do not strictly require 12th Mathematics. SkillSense maps pathways for both Math and Non-Math commerce students."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#04211F]">
      <SeoHead
        title="Career Test for Commerce Students | Free AI Test"
        description="Explore the best career options for commerce students with SkillSense's free AI career test — personality insights, course guidance, and a roadmap."
        path="/career-test-for-commerce-students"
        exactTitle={true}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#09A3A3] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Commerce Stream Aptitude Test
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Sora'] tracking-tight text-[#04302E] max-w-3xl leading-tight mb-4">
          Best Career Options for Commerce Students
        </h1>

        <h2 className="text-lg sm:text-xl font-semibold text-[#09A3A3] mb-6 max-w-2xl leading-snug">
          Take a Free AI-Powered Career Test Designed for Commerce Students
        </h2>

        <p className="text-base text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Commerce is much bigger than traditional accounting. Discover whether you're best suited for 
          Investment Banking, Corporate Law, FinTech, Actuarial Science, or Entrepreneurship.
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onStartTest}
            className="px-8 py-4 rounded-full bg-[#04302E] hover:bg-[#064e4a] text-white text-base font-bold shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer hover:gap-3"
          >
            Start Free Commerce Aptitude Test
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/"
            className="px-6 py-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-white transition-all"
          >
            Explore All Programs
          </a>
        </div>
      </section>

      {/* Top Career Tracks */}
      <section className="py-14 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto border-t border-gray-200">
        <h3 className="text-2xl font-bold font-['Sora'] text-[#04302E] mb-2 text-center">
          High-Growth Commerce Specializations
        </h3>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Match your analytical and leadership personality with the right financial or corporate discipline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <Landmark className="w-10 h-10 text-amber-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Chartered Accountancy & Audit</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              ICAI CA, ACCA, and US CPA credentials for auditing, corporate taxation, and advisory.
            </p>
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: CA Foundation, ACCA
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <LineChart className="w-10 h-10 text-teal-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Investment Banking & Valuation</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Mergers & acquisitions, portfolio management, equity research, and venture capital.
            </p>
            <div className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: CFA, CUET-UG (SRCC/St. Xavier's)
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Management & Corporate Strategy</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              BBA, BMS, and prestigious IIM 5-Year Integrated Programs (IPM) right after Class 12.
            </p>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: IPMAT, JIPMAT, NPAT
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Scientific Methodology */}
      <section className="py-12 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto text-center">
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-8">
          <ShieldCheck className="w-10 h-10 text-[#09A3A3] mx-auto mb-3" />
          <h4 className="text-xl font-bold text-[#04302E] mb-2 font-['Sora']">
            Designed by Career Psychologists & AiSense LLP
          </h4>
          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
            Supported by the SINE IIT Bombay incubation ecosystem. Find your exact commercial archetype in 10 minutes.
          </p>
          <button
            onClick={onStartTest}
            className="px-6 py-3 rounded-full bg-[#04302E] text-white text-sm font-bold shadow-md hover:bg-[#064e4a] transition-all cursor-pointer"
          >
            Discover My Commerce Career Match
          </button>
        </div>
      </section>
    </div>
  );
}
