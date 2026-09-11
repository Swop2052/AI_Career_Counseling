import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function ConsentForm({ onBack, onHome }) {
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
            <span className="text-[10px] font-semibold text-[#09A3A3] mt-0.5">Consent Form</span>
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
                1. About This Consent Form
              </button>
              <button
                onClick={() => scrollToSection('sec_2')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_2' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                2. Who We Are (Data Fiduciary)
              </button>
              <button
                onClick={() => scrollToSection('sec_3')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_3' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                3. What Personal Data We Collect
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
                5. Data Sharing
              </button>
              <button
                onClick={() => scrollToSection('sec_6')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_6' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                6. Data Retention & Erasure
              </button>
              <button
                onClick={() => scrollToSection('sec_7')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_7' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                7. Data Breach Notification
              </button>
              <button
                onClick={() => scrollToSection('sec_8')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_8' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                8. Your Rights as a Data Principal
              </button>
              <button
                onClick={() => scrollToSection('sec_9')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_9' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                9. Minor Users & Parental Consent
              </button>
              <button
                onClick={() => scrollToSection('sec_10')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_10' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                10. AI Processing Disclosure (VERA)
              </button>
              <button
                onClick={() => scrollToSection('sec_11')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_11' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                11. Consent Declaration
              </button>
              
            </nav>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <section className="flex-1 min-w-0 bg-white rounded-3xl shadow-sm border border-[#E3EFEC] p-6 sm:p-10">
          <div className="mb-10 pb-8 border-b border-[#E3EFEC]">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#04211F] mb-4 tracking-tight">Consent Form</h1>
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
                <p>INFORMED CONSENT FORM</p>
                <p>Governed by: DPDP Act 2023 & DPDP Rules 2025</p>
                <p>Operated by: AI Sense LLP  |  Washim, Maharashtra</p>
                </div>
            </motion.div>
            <motion.div id="sec_1" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                1. About This Consent Form
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>This Consent Form is issued by AI Sense LLP, operators of the SkillSense Career Assessment Platform, in compliance with:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Digital Personal Data Protection Act, 2023 (DPDP Act)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Digital Personal Data Protection Rules, 2025 (DPDP Rules) — notified by MeitY on 13 November 2025</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Enforcement deadline: 13 May 2027</span>
                </div>
                <p>By creating an account or using the SkillSense platform, you (or your parent/guardian if you are below 18 years of age) provide free, specific, informed, and unconditional consent as required under Section 6 of the DPDP Act, 2023.</p>
                <p>Legal Basis: Section 6 - DPDP Act 2023 | Rule 3 - DPDP Rules 2025 (Consent Notice Requirements)</p>
                </div>
            </motion.div>
            <motion.div id="sec_2" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                2. Who We Are (Data Fiduciary)
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Platform Name: SkillSense Career Assessment Platform</p>
                <p>Website: careerguide.aisense.co.in</p>
                <p>Operated By: AI Sense LLP</p>
                <p>Registered Address: Washim, Maharashtra, India</p>
                <p>Grievance Officer: Designated Grievance Officer, AI Sense LLP</p>
                <p>Response guaranteed within 90 days (Rule 14, DPDP Rules 2025)</p>
                <p>Legal Basis: Section 8 - DPDP Act 2023 (Data Fiduciary Obligations)</p>
                </div>
            </motion.div>
            <motion.div id="sec_3" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                3. What Personal Data We Collect
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>In compliance with the data minimisation principle under Section 8(3) of the DPDP Act 2023, we collect only data necessary for the purposes stated below:</p>
                <p>3.1 Account & Identity Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Full name, email address, and password (hashed — never stored in plain text)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Educational background and career interest profile</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Psychometric assessment responses (42-question RIASEC-based assessment)</span>
                </div>
                <p>3.2 Assessment & Career Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Assessment attempt records and history</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Generated Career Roadmap results</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA AI counsellor interaction logs</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Gamification data: XP points, coins, streaks, achievements</span>
                </div>
                <p>3.3 Payment & Credit Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Assessment Credit balance, purchase history, and deduction logs</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Razor pay transaction ID, payment reference ID, payment status</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Plan purchased, original amount, discount applied, final amount paid</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Date/time of transaction, referral or campaign code used</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Card numbers, CVV, and banking credentials are handled exclusively by Razor pay and are NOT stored by Skill Sense or AI Sense LLP.
                </div>
                <p>3.4 Technical Data</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Login session information and platform activity logs</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Device and browser information for security purposes</span>
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
        <p>Your data is processed only for specified, lawful purposes under Section 6(1)(b) of the DPDP Act 2023:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To create and manage your SkillSense account</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To administer the RIASEC career assessment and generate personalised Career Roadmaps</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To power VERA, our AI career counselor, via Anthropic API</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To operate the credit-based Assessment Credit system via Razor pay</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To display gamification progress (XP, coins, streaks, achievements)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To send platform notifications, account updates, and support responses</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To resolve disputes, prevent fraud, and maintain audit records</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>To comply with applicable Indian laws and regulatory obligations</span>
                </div>
                <p>Your data is NOT used for: behavioural advertising, marketing profiling, or sale to any third party.</p>
                <p>Legal Basis: Section 6 - DPDP Act 2023 | Rule 3(1) - DPDP Rules 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                5. Data Sharing
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP does NOT sell, rent, or share your personal data with any third party for commercial or advertising purposes.</p>
                <p>Data is shared only with the following service processors, strictly for platform operation:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Razor pay Payment Solutions Pvt. Ltd. — payment processing and transaction management</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Anthropic PBC — AI counselor (VERA) powered via Anthropic API</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Hosting / Cloud Infrastructure Provider — secured server operations</span>
                </div>
                <p>All third-party processors are contractually bound to process data only as instructed by AI Sense LLP and to maintain standards consistent with the DPDP Act 2023.</p>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Razor pay independently stores payment card/banking data under their own PCI-DSS compliant infrastructure. SkillSense is not responsible for Razorpay's data storage practices. Please review Razorpay's Privacy Policy at razorpay.com.
                </div>
                <p>No psychometric data, Career Roadmap results, or personal information is shared with educational institutions, employers, counsellors, or any other external organisations.</p>
                <p>Legal Basis: Section 8(2) - DPDP Act 2023 (Data Processor Obligations)</p>
                </div>
            </motion.div>
            <motion.div id="sec_6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                6. Data Retention & Erasure
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Personal data is retained only as long as necessary to fulfil the stated purpose, per Section 8(7) of the DPDP Act 2023 and Rule 8 of the DPDP Rules 2025:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Account & Assessment Data: 3 years from last login or account activity</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Payment & Transaction Records: 3 years from date of transaction (aligned with DPDP Rules 2025 and applicable financial compliance requirements)</span>
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
                  <span>Consent Records: 7 years (mandatory under DPDP Rules 2025 for consent audit trails)</span>
                </div>
                <p>You will be notified at least 48 hours before any mandatory erasure of your personal data (Rule 8, DPDP Rules 2025). You may respond to retain your account, or your data will be permanently deleted.</p>
                <p>Upon account deletion, all personal data will be erased within 30 days, except records required for legal or financial compliance.</p>
                <p>Legal Basis: Section 8(7) - DPDP Act 2023 | Rule 8 - DPDP Rules 2025 | Third Schedule (Retention Periods)</p>
                </div>
            </motion.div>
            <motion.div id="sec_7" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                7. Data Breach Notification
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>In the event of a personal data breach, AI Sense LLP will:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Immediately notify the Data Protection Board of India (DPBI) upon discovery — without delay</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Notify all affected users within 72 hours of discovering the breach (Stage 2, Rule 7, DPDP Rules 2025)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Provide: breach description, data categories exposed, likely consequences, mitigation steps taken, and contact details</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Penalties for breach notification failure: Up to Rs 200 crore per incident. Inadequate security safeguards: Up to Rs 250 crore. These can apply simultaneously (DPDP Rules 2025).
                </div>
                <p>Legal Basis: Section 8(6) - DPDP Act 2023 | Rule 7 - DPDP Rules 2025 (Two-Stage Breach Notification)</p>
                </div>
            </motion.div>
            <motion.div id="sec_8" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                8. Your Rights as a Data Principal
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Under the DPDP Act 2023, you have the following rights, exercisable at any time:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Access (Section 11): Request summary of your personal data held and how it is processed</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Correction & Erasure (Section 12): Correct inaccurate data or request erasure when purpose is fulfilled — resolved within 90 days</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Grievance Redressal (Section 13): File a complaint with our Grievance Officer — mandatory resolution within 90 days (Rule 14)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Nominate (Section 14): Appoint a nominee to exercise your rights in the event of death or incapacity</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Right to Withdraw Consent (Section 7): Withdraw your consent at any time; withdrawal does not affect prior lawful processing</span>
                </div>
                <p>To exercise any right, contact: Designated Grievance Officer, AI Sense LLP at</p>
                <p>Unresolved complaints may be escalated to the Data Protection Board of India (DPBI).</p>
                <p>Escalation: Data Protection Board of India (DPBI) | Constituted under DPDP Act 2023, operational November 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_9" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                9. Minor Users & Parental Consent
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>Under Section 9 of the DPDP Act 2023 and Rules 10 & 12 of the DPDP Rules 2025, a 'child' means any individual below 18 years of age (as per the Juvenile Justice Act, 2015).</p>
                <p>For users below 18 years of age:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>A parent or legal guardian must provide verifiable consent before the minor uses SkillSense</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>SkillSense implements technical age-gate measures to detect and prevent minor registration without verified parental consent</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Psychometric data and assessment results of minors are subject to the highest level of access restriction</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Behavioural tracking, profiling, or targeted advertising directed at minors is strictly prohibited</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Minor data will not be shared with any third party beyond mandatory operational processors</span>
                </div>
                <p>By submitting this form on behalf of a minor, the parent/guardian confirms they have read and understood this Consent Form and provide verified parental consent.</p>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  SkillSense serves students from Class 8 upward. All users below 18 are treated as minors under DPDP Act 2023, requiring verified parental consent regardless of the student's age within that range.
                </div>
                <p>Legal Basis: Section 9 - DPDP Act 2023 | Rules 10 & 12 - DPDP Rules 2025 | Fourth Schedule</p>
                </div>
            </motion.div>
            <motion.div id="sec_10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                10. AI Processing Disclosure (VERA)
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SkillSense uses VERA, an AI-powered career counselor built on the Anthropic API. By consenting to use SkillSense, you acknowledge:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA's responses are generated by an AI model and do not constitute professional career or psychological counselling</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Your interaction inputs to VERA are processed via Anthropic's API under AI Sense LLP's Data Processing Agreement with Anthropic</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Raw personal identifiers are minimised before being passed to the API</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Anthropic does not train on your data by default under their enterprise API agreement</span>
                </div>
                <p>Reference: Anthropic PBC Data Processing Agreement | anthropic.com/privacy</p>
                </div>
            </motion.div>
            <motion.div id="sec_11" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                11. Consent Declaration
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>By proceeding to register and use the SkillSense platform, I confirm:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>I have read and understood this Consent Form in full</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>I provide free, specific, informed, and unconditional consent as required under Section 6 of the DPDP Act 2023</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>I understand my rights under the DPDP Act 2023 and how to exercise them</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>I understand that I may withdraw this consent at any time without affecting prior lawful processing</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>(If parent/guardian) I provide verified parental consent on behalf of the minor named below and accept responsibility for their use of the platform</span>
                </div>
                <p>User/Guardian Full Name: _________________________________________________</p>
                <p>Relationship to Minor (if applicable): ______________________________________</p>
                <p>Date: _________________________________</p>
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
