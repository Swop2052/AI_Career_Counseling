import React from 'react';
import { ArrowRight, CheckCircle2, Cpu, Dna, Rocket, Sparkles, ShieldCheck } from 'lucide-react';
import SeoHead from '../common/SeoHead';

export default function After12thScience({ onStartTest }) {
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
          "name": "Career Options After 12th Science",
          "item": "https://skillsense.aisense.co.in/after-12th-science-career-options"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are the best career options after 12th Science without JEE?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Beyond JEE engineering, 12th Science students can pursue High-Demand careers in Data Science, Artificial Intelligence, Commercial Pilot training, Architecture (NATA), UI/UX Design (UCEED), NDA (Defense), Pure Sciences research (IISER/NISER), and Biotechnology."
          }
        },
        {
          "@type": "Question",
          "name": "What high-paying careers can PCB students choose besides MBBS?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PCB students have lucrative options in Biomedical Engineering, Genetic Counseling, Clinical Research, Bioinformatics, Food Technology, and Healthcare Administration without clearing NEET."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#04211F]">
      <SeoHead
        title="Career Options After 12th Science | Free AI Test"
        description="Not sure what to do after 12th Science? Discover the best-fit courses and careers with SkillSense's free AI career assessment and personal roadmap."
        path="/after-12th-science-career-options"
        exactTitle={true}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#09A3A3] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Class 12 Science Career Navigator
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Sora'] tracking-tight text-[#04302E] max-w-3xl leading-tight mb-4">
          What to Do After 12th Science? Discover Your Best-Fit Career
        </h1>

        <h2 className="text-lg sm:text-xl font-semibold text-[#09A3A3] mb-6 max-w-2xl leading-snug">
          Free AI Career Assessment for Science Stream Students
        </h2>

        <p className="text-base text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Stuck between Engineering, Medicine, or exploring modern careers in AI, Biotechnology, and Design? 
          SkillSense maps your analytical mindset against 100+ high-growth science careers and verified salary benchmarks.
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onStartTest}
            className="px-8 py-4 rounded-full bg-[#04302E] hover:bg-[#064e4a] text-white text-base font-bold shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer hover:gap-3"
          >
            Start Free Science Aptitude Test
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/"
            className="px-6 py-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-white transition-all"
          >
            View All Features
          </a>
        </div>
      </section>

      {/* Modern Science Horizons */}
      <section className="py-14 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto border-t border-gray-200">
        <h3 className="text-2xl font-bold font-['Sora'] text-[#04302E] mb-2 text-center">
          Exciting Fields Beyond Traditional Engineering & MBBS
        </h3>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Explore booming domains offering top packages and global opportunities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <Cpu className="w-10 h-10 text-cyan-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Artificial Intelligence & Robotics</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Machine Learning, Autonomous Systems, and Cloud Architecture. High starting packages from ₹8-25 LPA.
            </p>
            <div className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: JEE Main, BITSAT, State CETs
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <Dna className="w-10 h-10 text-emerald-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Biotechnology & Genomics</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Bioinformatics, Drug Discovery, and Genetic Engineering for PCB students looking beyond hospitals.
            </p>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: CUET-UG, NEET, ICAR
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <Rocket className="w-10 h-10 text-purple-600 mb-4" />
            <h4 className="text-lg font-bold text-[#04302E] mb-2">Defense & Commercial Aviation</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              National Defence Academy (NDA Air Force/Navy), Commercial Pilot License (CPL), and Space Science.
            </p>
            <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg w-fit">
              Exams: NDA, IGRUA Pilot Exam
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Footer */}
      <section className="py-12 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto text-center">
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-8">
          <ShieldCheck className="w-10 h-10 text-[#09A3A3] mx-auto mb-3" />
          <h4 className="text-xl font-bold text-[#04302E] mb-2 font-['Sora']">
            Validated by AiSense LLP & SINE IIT Bombay Network
          </h4>
          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
            Get personalized cut-offs, college rankings, and clear eligibility roadmaps tailored to your score in under 10 minutes.
          </p>
          <button
            onClick={onStartTest}
            className="px-6 py-3 rounded-full bg-[#04302E] text-white text-sm font-bold shadow-md hover:bg-[#064e4a] transition-all cursor-pointer"
          >
            Find My Ideal Science Career
          </button>
        </div>
      </section>
    </div>
  );
}
