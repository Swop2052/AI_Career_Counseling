import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../translations/LanguageContext';

export default function PrivacyPolicy({ onBack, onHome }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#F0F7F6] via-white to-[#CFEDED]/30 text-[#04211F] font-sans flex flex-col justify-between selection:bg-[#09A3A3] selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-[#09A3A3]/20 px-6 sm:px-12 py-3.5 flex items-center justify-between shadow-xs">
        <div 
          onClick={onHome}
          className="flex items-center gap-3 cursor-pointer group"
          title="Go to Home"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04302E] to-[#09A3A3] p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-[#04302E] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#32d4d4]" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#04211F] leading-none">
              SkillSense<span className="text-[#09A3A3]">.</span>
            </span>
            <span className="text-[10px] font-semibold text-[#09A3A3] mt-0.5">{t('privacyHeading')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-[#09A3A3]/10 hover:bg-[#09A3A3]/20 text-[#04302E] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border border-[#09A3A3]/30 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#09A3A3]" />
            <span>Back to App</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-12 py-10 flex flex-col md:flex-row gap-10">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-full md:w-1/3 lg:w-1/4 hidden md:block shrink-0">
          <div className="sticky top-28">
            <h3 className="text-xs font-bold text-[#5B7975] uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> CONTENTS
            </h3>
            <nav className="flex flex-col gap-1.5 border-l-2 border-[#E3EFEC] pl-4">
              <button
                onClick={() => scrollToSection('intro')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'intro' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                Introduction
              </button>
              <button
                onClick={() => scrollToSection('sec_1')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_1' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                1. Introduction
              </button>
              <button
                onClick={() => scrollToSection('sec_2')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_2' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                2. Scope & Applicability
              </button>
              <button
                onClick={() => scrollToSection('sec_3')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_3' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                3. Categories of Personal Data Collected
              </button>
              <button
                onClick={() => scrollToSection('sec_4')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_4' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                4. Purpose of Processing
              </button>
              <button
                onClick={() => scrollToSection('sec_5')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_5' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                5. Legal Basis for Processing
              </button>
              <button
                onClick={() => scrollToSection('sec_6')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_6' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                6. Third-Party Data Processors & Data Sharing
              </button>
              <button
                onClick={() => scrollToSection('sec_7')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_7' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                7. Data Storage & Security Safeguards
              </button>
              <button
                onClick={() => scrollToSection('sec_8')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_8' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                8. Data Retention & Erasure Policy
              </button>
              <button
                onClick={() => scrollToSection('sec_9')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_9' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                9. Data Breach Notification
              </button>
              <button
                onClick={() => scrollToSection('sec_10')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_10' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                10. Your Rights as a Data Principal
              </button>
              <button
                onClick={() => scrollToSection('sec_11')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_11' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                11. Minor Users (Below 18 Years)
              </button>
              <button
                onClick={() => scrollToSection('sec_12')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_12' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                12. AI Processing Disclosure (VERA)
              </button>
              <button
                onClick={() => scrollToSection('sec_13')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_13' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                13. Cross-Border Data Transfers
              </button>
              <button
                onClick={() => scrollToSection('sec_14')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_14' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                14. Cookies & Technical Tracking
              </button>
              <button
                onClick={() => scrollToSection('sec_15')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_15' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                15. Changes to This Privacy Policy
              </button>
              <button
                onClick={() => scrollToSection('sec_16')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_16' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                16. Contact & Grievance Redressed
              </button>
              
            </nav>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <section className="flex-1 min-w-0 bg-white rounded-3xl shadow-sm border border-[#E3EFEC] p-6 sm:p-10">
          <div className="mb-10 pb-8 border-b border-[#E3EFEC]">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#04211F] mb-4 tracking-tight">{t('privacyHeading')}</h1>
            <p className="text-sm font-semibold text-[#5B7975] uppercase tracking-wider">Governed by DPDP Act 2023 & Indian Laws</p>
          </div>
          
          <div className="space-y-12">
            <motion.div id="intro" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                Introduction
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SkillSense</p>
                <p>Career Assessment Platform</p>
                <p>careerguide.aisense.co.in</p>
                <p>PRIVACY POLICY</p>
                <p>Governed by: DPDP Act 2023 & DPDP Rules 2025</p>
                <p>Operated by: AI Sense LLP  |  Washim, Maharashtra</p>
                </div>
            </motion.div>
            <motion.div id="sec_1" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                1. Introduction
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP, operator of the SkillSense Career Assessment Platform, is committed to protecting your personal data. This Privacy Policy is issued in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Digital Personal Data Protection Rules, 2025 (DPDP Rules), notified by the Ministry of Electronics and Information Technology (MeitY) on 13 November 2025.</p>
                <p>This Policy applies to all users of SkillSense: students, parents/guardians of minor users, and any individuals interacting with the platform.</p>
                <p>Platform Name: SkillSense Career Assessment Platform</p>
                <p>Data Fiduciary: AI Sense LLP</p>
                <p>Registered Address: Washim, Maharashtra, India</p>
                <p>Website: careerguide.aisense.co.in</p>
                <p>Grievance Officer: Designated Grievance Officer, AI Sense</p>
                <p>Legal Framework: DPDP Act 2023 (Sections 6-14) | DPDP Rules 2025 (Rules 3-14) | IT Act 2000 | Indian Contract Act 1872</p>
                </div>
            </motion.div>
            <motion.div id="sec_2" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                2. Scope & Applicability
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Applies to all digital personal data collected, processed, or stored by SkillSense</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Covers data via the SkillSense website at careerguide.aisense.co.in</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Applies to users located in India and processing of data of Indian residents outside India</span>
                </div>
                <p>Legal Basis: Section 3 - DPDP Act 2023 (Territorial Scope)</p>
                </div>
            </motion.div>
            <motion.div id="sec_3" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                3. Categories of Personal Data Collected
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>3.1 Account & Identity Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Full name and email address</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Password — stored as a secure cryptographic hash; never stored in plain text</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Educational background and career interest profile</span>
                </div>
                <p>3.2 Psychometric & Assessment Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Responses to the 42-question career assessment</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Assessment attempt records, history, and result scores</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Generated Career Roadmap content and recommendations</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA AI counselor interaction inputs and outputs</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Psychometric assessment data is treated as sensitive personal information. It is never sold, shared with employers, educational institutions, or counsellors, or used for advertising profiling.
                </div>
                <p>3.3 Payment & Credit Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Razor pay Order ID and Payment Reference ID</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Payment status (success / failure / pending)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Plan purchased (Rs 19 / Rs 599)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Original amount, discount amount, final amount paid</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Date and time of transaction</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Referral or campaign code used (if applicable)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Assessment Credit balance, purchase records, and deduction logs</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Card numbers, CVV, and all banking credentials are stored solely by Razor pay under PCI-DSS compliant infrastructure. AI Sense LLP does not store, access, or process this data. Please refer to Razorpay's Privacy Policy at razorpay.com for their data handling practices.
                </div>
                <p>3.4 Gamification Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>XP points, coins, and streak records</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Achievement badges and engagement activity logs</span>
                </div>
                <p>3.5 Technical Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Login session information and authentication records</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Platform usage activity and feature interaction logs</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Device and browser information collected for security purposes</span>
                </div>
                <p>Legal Basis: Section 8(3) - DPDP Act 2023 (Data Minimisation) | Rule 6 - DPDP Rules 2025 (Security Safeguards)</p>
                </div>
            </motion.div>
            <motion.div id="sec_4" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                4. Purpose of Processing
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>We process personal data only for specified, lawful purposes under Section 6 of the DPDP Act 2023:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Account creation, authentication, and profile management</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Administering the career assessment and generating personalised Career Roadmaps</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Powering VERA, our AI career counselor, via Anthropic API</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Operating the Assessment Credit system (purchase, redemption, and deduction tracking via Razor pay)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Displaying gamification elements and engagement features</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Sending platform notifications, transaction receipts, and support responses</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Fraud prevention, dispute resolution, and maintaining audit trails</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Complying with applicable Indian laws and regulatory obligations</span>
                </div>
                <p>We DO NOT process data for: behavioural advertising, marketing profiling, or sale/licence to any third party.</p>
                <p>Legal Basis: Section 6(1)(b) - DPDP Act 2023 | Rule 3(1) - DPDP Rules 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                5. Legal Basis for Processing
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Consent (Section 6): Free, specific, informed, unconditional consent obtained via Consent Form at registration</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Legitimate Use (Section 7): Processing necessary to perform the service contract — career assessment, payment, credit management</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Legal Obligation: Processing required under Indian law — financial records, tax compliance, regulatory requirements</span>
                </div>
                <p>Legal Basis: Sections 6 & 7 - DPDP Act 2023</p>
                </div>
            </motion.div>
            <motion.div id="sec_6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                6. Third-Party Data Processors & Data Sharing
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP does NOT sell, rent, or share personal data for commercial or advertising purposes.</p>
                <p>Data is shared only with the following processors under strict contractual data protection obligations:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Razor pay Payment Solutions Pvt. Ltd. — payment processing. Razor pay independently stores card/banking data under their own PCI-DSS compliant infrastructure. SkillSense only retains transaction metadata (IDs, status, amounts, date).</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Anthropic PBC — AI career counselor (VERA) powered via Anthropic API. Anthropic's enterprise API does not train on customer data by default. A Data Processing Agreement (DPA) governs this relationship.</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Hosting / Cloud Infrastructure Provider — secured SQLite database and server operations</span>
                </div>
                <p>All processors are contractually obligated to process data only as instructed by AI Sense LLP and to maintain data protection standards consistent with the DPDP Act 2023.</p>
                <p>No psychometric data, Career Roadmap results, or personal information is shared with educational institutions, employers, or counsellors.</p>
                <p>Legal Basis: Section 8(2) - DPDP Act 2023 (Data Processor Agreements) | Data Processing Agreement with Anthropic PBC</p>
                </div>
            </motion.div>
            <motion.div id="sec_7" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                7. Data Storage & Security Safeguards
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP implements reasonable security safeguards as mandated by Rule 6 of the DPDP Rules 2025:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>All personal data stored in a secured SQLite database on VPS server infrastructure</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Encryption of personal data in transit (TLS) and at rest</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Access controls limiting data access to authorised personnel only</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Passwords stored using secure cryptographic hashing — never in plain text</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Payment credentials managed exclusively by Razor pay — not stored by SkillSense</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Server credentials (database, Razor pay API keys, SMTP) stored via environment variables — never exposed in frontend code</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Periodic security reviews and vulnerability assessments</span>
                </div>
                <p>Legal Basis: Rule 6 - DPDP Rules 2025 (Reasonable Security Safeguards)</p>
                </div>
            </motion.div>
            <motion.div id="sec_8" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                8. Data Retention & Erasure Policy
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Personal data is retained only as long as necessary for the stated purpose, per Section 8(7) of the DPDP Act 2023 and Rule 8 of the DPDP Rules 2025:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Account & Profile Data: 3 years from last login or platform interaction</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Psychometric Assessment & Career Roadmap Data: 3 years from last platform activity</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Payment & Transaction Records: 3 years from date of transaction (aligned with DPDP Rules 2025 and applicable financial compliance obligations)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA AI Interaction Logs: 3 years from last session</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Gamification Data: 3 years from last platform interaction</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Security & Access Logs: Minimum 1 year as required by DPDP Rules 2025</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Consent Records & Audit Trails: 7 years (mandatory under DPDP Rules 2025 for consent managers)</span>
                </div>
                <p>Note: Razor pay independently retains payment card/banking data under their own retention policy. SkillSense only retains transaction metadata as described above.</p>
                <p>You will be notified at least 48 hours before any mandatory erasure of your personal data (Rule 8). If you respond within 48 hours by logging in or contacting us, your data will be retained. If not, it will be permanently deleted.</p>
                <p>Upon voluntary account deletion, all personal data will be erased within 30 days, except records required for legal or financial compliance.</p>
                <p>Legal Basis: Section 8(7) - DPDP Act 2023 | Rule 8 - DPDP Rules 2025 | Third Schedule (Sector-Specific Retention Periods)</p>
                </div>
            </motion.div>
            <motion.div id="sec_9" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                9. Data Breach Notification
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>In the event of a personal data breach, AI Sense LLP will comply with the two-stage notification obligation under Rule 7 of the DPDP Rules 2025:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Stage 1 — Immediate: Notify the Data Protection Board of India (DPBI) without delay upon discovery of any breach</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Stage 2 — Within 72 hours: Notify all affected Data Principals with: breach description, categories of data exposed, likely consequences, mitigation steps taken, and contact details for queries</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Penalties under DPDP Rules 2025: Failure to notify - Up to Rs 200 crore per incident. Inadequate security safeguards - Up to Rs 250 crore. These penalties can apply simultaneously.
                </div>
                <p>Legal Basis: Section 8(6) - DPDP Act 2023 | Rule 7 - DPDP Rules 2025 (Two-Stage Breach Notification)</p>
                </div>
            </motion.div>
            <motion.div id="sec_10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                10. Your Rights as a Data Principal
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Under the DPDP Act 2023, you have the following rights:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Access (Section 11): Request a summary of personal data held and how it is being processed</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Correction & Erasure (Section 12): Correct inaccurate data or request erasure when the purpose is fulfilled — resolved within 90 days</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Grievance Redressal (Section 13): File a complaint with our Grievance Officer — mandatory resolution within 90 days (Rule 14)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Nominate (Section 14): Appoint a nominee to exercise your rights in case of death or incapacity</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Withdraw Consent (Section 7): Withdraw consent at any time; prior lawful processing is not affected</span>
                </div>
                <p>Grievance Officer: Designated Grievance Officer, AI Sense LLP</p>
                <p>Unresolved complaints may be escalated to the Data Protection Board of India (DPBI).</p>
                <p>Escalation: Data Protection Board of India (DPBI) | Constituted under DPDP Act 2023, operational November 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_11" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                11. Minor Users (Below 18 Years)
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Under Section 9 of the DPDP Act 2023 and Rules 10 & 12 of the DPDP Rules 2025, a 'child' means any individual below 18 years of age (Juvenile Justice Act, 2015).</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>SkillSense serves students from Class 8 upward — all users below 18 are treated as minors under DPDP Act 2023</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Verifiable parental/guardian consent is mandatory before processing any minor's personal data</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Technical age-gate measures are implemented to prevent minor registration without parental consent</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Psychometric data and assessment results of minors are subject to highest access restrictions</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Behavioural tracking, profiling, or targeted advertising directed at minors is strictly prohibited</span>
                </div>
                <p>Legal Basis: Section 9 - DPDP Act 2023 | Rules 10 & 12 - DPDP Rules 2025 | Fourth Schedule</p>
                </div>
            </motion.div>
            <motion.div id="sec_12" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                12. AI Processing Disclosure (VERA)
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SkillSense uses VERA, an AI-powered career counsellor built on the Anthropic API. Users should be aware:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA's responses are AI-generated and do not constitute professional career or psychological counselling</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>User inputs to VERA are processed via Anthropic API under a Data Processing Agreement</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Anthropic does not train on customer API data by default under their enterprise agreement</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Personal identifiers are minimised before being passed to the API</span>
                </div>
                <p>Reference: Anthropic PBC Data Processing Agreement | anthropic.com/privacy</p>
                </div>
            </motion.div>
            <motion.div id="sec_13" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                13. Cross-Border Data Transfers
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SkillSense primarily stores and processes data within India. Any cross-border processing (e.g., via Anthropic API hosted outside India) is governed by Data Processing Agreements and conducted only with processors operating under standards consistent with the DPDP Act 2023.</p>
                <p>Legal Basis: Section 16 - DPDP Act 2023 (Cross-Border Data Transfer)</p>
                </div>
            </motion.div>
            <motion.div id="sec_14" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                14. Cookies & Technical Tracking
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SkillSense may use session cookies necessary for platform authentication and operation. We do not use third-party advertising cookies, behavioural tracking pixels, or marketing analytics tools.</p>
                </div>
            </motion.div>
            <motion.div id="sec_15" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                15. Changes to This Privacy Policy
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>We may update this Privacy Policy to reflect changes in our practices or regulatory requirements. Material changes will be communicated via email or platform notification with at least 15 days' notice. Continued use after changes take effect constitutes acceptance.</p>
                </div>
            </motion.div>
            <motion.div id="sec_16" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                16. Contact & Grievance Redressed
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Organisation: AI Sense LLP</p>
                <p>Platform: SkillSense — careerguide.aisense.co.in</p>
                <p>Grievance Officer: Designated Grievance Officer, AI Sense LLP</p>
                <p>Address: Washim, Maharashtra, India</p>
                <p>We are committed to responding to all grievances within 90 days as mandated by Rule 14 of the DPDP Rules 2025.</p>
                <p>AI Sense LLP  |  Washim, Maharashtra, India  |  careerguide.aisense.co.in</p>
                <p>Available in: English | Hindi | Marathi</p>
                <p>Governed by: DPDP Act 2023 & DPDP Rules 2025 (notified 13 November 2025)  |  Enforcement: 13 May 2027</p>
                <p>Regulatory Authority: Data Protection Board of India (DPBI)</p>
                </div>
            </motion.div>
            
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-[#E3EFEC] py-6 px-6 sm:px-12 text-center flex flex-col items-center gap-2">
        <p className="text-xs font-semibold text-[#5B7975]">
          © {new Date().getFullYear()} AI Sense LLP. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
