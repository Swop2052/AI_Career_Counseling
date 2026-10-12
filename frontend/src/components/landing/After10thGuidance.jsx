import React from 'react';
import { ArrowRight, CheckCircle2, Compass, BookOpen, Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import SeoHead from '../common/SeoHead';

export default function After10thGuidance({ onStartTest }) {
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
          "name": "Which Stream After 10th?",
          "item": "https://skillsense.aisense.co.in/after-10th-career-guidance"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I choose between Science, Commerce, and Arts after 10th?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Stream selection after 10th should be based on your psychological aptitude and natural interest profile, not peer pressure or board exam marks alone. SkillSense's free 48-question RIASEC assessment evaluates your analytical, creative, and practical strengths to recommend the ideal stream."
          }
        },
        {
          "@type": "Question",
          "name": "Can I switch streams after 12th if I choose Commerce or Arts now?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, many modern fields like Law (CLAT), Design (NID/UCEED), Management (IPMAT/BBA), and Mass Communication are open to all streams. SkillSense maps both direct and cross-stream career pathways."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#04211F]">
      <SeoHead
        title="Which Stream After 10th? Free AI Career Test"
        description="Confused about Arts, Science or Commerce after 10th? Take SkillSense's free AI career test to find the stream and path that fits you best."
        path="/after-10th-career-guidance"
        exactTitle={true}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#09A3A3] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Class 10 Stream Selection Guide
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Sora'] tracking-tight text-[#04302E] max-w-3xl leading-tight mb-4">
          Which Stream Should You Choose After 10th?
        </h1>

        <h2 className="text-lg sm:text-xl font-semibold text-[#09A3A3] mb-6 max-w-2xl leading-snug">
          Take a Free AI Career Test Built for Class 10 Students
        </h2>

        <p className="text-base text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Choosing between Science, Commerce, and Arts shouldn't be based on friend circles or guesswork. 
          SkillSense evaluates your natural strengths through 48 fun psychometric questions to find your genuine fit in 10 minutes.
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onStartTest}
            className="px-8 py-4 rounded-full bg-[#04302E] hover:bg-[#064e4a] text-white text-base font-bold shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer hover:gap-3"
          >
            Start Free Class 10 Assessment
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/"
            className="px-6 py-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-white transition-all"
          >
            Explore Platform Overview
          </a>
        </div>
      </section>

      {/* Stream Comparison Grid */}
      <section className="py-14 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto border-t border-gray-200">
        <h3 className="text-2xl font-bold font-['Sora'] text-[#04302E] mb-2 text-center">
          Compare 11th & 12th Streams
        </h3>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Understand what each stream offers, what subjects you'll study, and which careers it leads to.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Science */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-[#04302E] mb-2">Science Stream (PCM / PCB)</h4>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">For Analytical & Inquisitive Minds</p>
            <ul className="text-sm text-gray-600 space-y-2.5 mb-6">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>PCM:</strong> Engineering, Computer Science, AI, Architecture, Defense.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>PCB:</strong> Medicine (MBBS), Biotechnology, Pharmacy, Genetics.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>PCMB:</strong> Maximum flexibility for both engineering and bio-sciences.</li>
            </ul>
          </div>

          {/* Commerce */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-[#04302E] mb-2">Commerce (With / Without Maths)</h4>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-4">For Strategic & Business Thinkers</p>
            <ul className="text-sm text-gray-600 space-y-2.5 mb-6">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Finance & Accounting:</strong> Chartered Accountancy (CA), CFA, CS.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Management:</strong> BBA, BMS, IPMAT (IIM 5-Year Integrated Program).</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Modern Fields:</strong> FinTech, Investment Banking, E-Commerce Strategy.</li>
            </ul>
          </div>

          {/* Arts */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-[#04302E] mb-2">Arts & Humanities</h4>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4">For Creative, Social & Expressive Minds</p>
            <ul className="text-sm text-gray-600 space-y-2.5 mb-6">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Law & Public Policy:</strong> 5-Year Integrated BA LLB via CLAT.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Design & Media:</strong> UI/UX Design (NID/UCEED), Journalism, Film.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> <strong>Social Sciences:</strong> Clinical Psychology, Civil Services (UPSC), Economics.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust & Scientific Methodology */}
      <section className="py-12 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto text-center">
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-8">
          <ShieldCheck className="w-10 h-10 text-[#09A3A3] mx-auto mb-3" />
          <h4 className="text-xl font-bold text-[#04302E] mb-2 font-['Sora']">
            Scientifically Validated Holland RIASEC Assessment
          </h4>
          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
            SkillSense is developed by <strong>AiSense LLP</strong>, incubated within the <strong>SINE IIT Bombay ecosystem</strong>. 
            Our 48-item questionnaire accurately evaluates your Realistic, Investigative, Artistic, Social, Enterprising, and Conventional traits.
          </p>
          <button
            onClick={onStartTest}
            className="px-6 py-3 rounded-full bg-[#04302E] text-white text-sm font-bold shadow-md hover:bg-[#064e4a] transition-all cursor-pointer"
          >
            Take 10-Minute Free Test Now
          </button>
        </div>
      </section>
    </div>
  );
}
