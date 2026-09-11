import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function TermsConditions({ onBack, onHome }) {
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
            <span className="text-[10px] font-semibold text-[#09A3A3] mt-0.5">Terms & Conditions</span>
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
                1. Agreement to Terms
              </button>
              <button
                onClick={() => scrollToSection('sec_2')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_2' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                2. Definitions
              </button>
              <button
                onClick={() => scrollToSection('sec_3')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_3' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                3. Eligibility
              </button>
              <button
                onClick={() => scrollToSection('sec_4')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_4' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                4. Platform Services
              </button>
              <button
                onClick={() => scrollToSection('sec_5')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_5' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                5. Assessment Credit System
              </button>
              <button
                onClick={() => scrollToSection('sec_6')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_6' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                6. Payments
              </button>
              <button
                onClick={() => scrollToSection('sec_7')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_7' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                7. Refund Policy
              </button>
              <button
                onClick={() => scrollToSection('sec_8')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_8' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                8. VERA AI Career Counselor — Disclaimer
              </button>
              <button
                onClick={() => scrollToSection('sec_9')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_9' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                9. User Conduct
              </button>
              <button
                onClick={() => scrollToSection('sec_10')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_10' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                10. Data Privacy Obligations
              </button>
              <button
                onClick={() => scrollToSection('sec_11')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_11' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                11. Data Breach Response
              </button>
              <button
                onClick={() => scrollToSection('sec_12')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_12' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                12. Intellectual Property
              </button>
              <button
                onClick={() => scrollToSection('sec_13')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_13' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                13. Limitation of Liability
              </button>
              <button
                onClick={() => scrollToSection('sec_14')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_14' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                14. Termination
              </button>
              <button
                onClick={() => scrollToSection('sec_15')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_15' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                15. Governing Law & Jurisdiction
              </button>
              <button
                onClick={() => scrollToSection('sec_16')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_16' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                16. Grievance Redressal
              </button>
              <button
                onClick={() => scrollToSection('sec_17')}
                className={`text-left text-sm font-semibold py-1.5 transition-colors ${activeSection === 'sec_17' ? 'text-[#09A3A3]' : 'text-[#5B7975] hover:text-[#04302E]'}`}
              >
                17. Changes to These Terms
              </button>
              
            </nav>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <section className="flex-1 min-w-0 bg-white rounded-3xl shadow-sm border border-[#E3EFEC] p-6 sm:p-10">
          <div className="mb-10 pb-8 border-b border-[#E3EFEC]">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#04211F] mb-4 tracking-tight">Terms & Conditions</h1>
            <p className="text-sm font-semibold text-[#5B7975] uppercase tracking-wider">Governed by DPDP Act 2023 & Indian Laws</p>
          </div>
          
          <div className="space-y-12">
            <motion.div id="intro" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                Introduction
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>SKILLSENSE</p>
                <p>Career Assessment Platform</p>
                <p>careerguide.aisense.co.in</p>
                <p>TERMS & CONDITIONS</p>
                <p>Governed by: DPDP Act 2023, DPDP Rules 2025 & Indian Contract Act 1872</p>
                <p>Operated by: AI Sense LLP  |  Washim, Maharashtra</p>
                </div>
            </motion.div>
            <motion.div id="sec_1" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                1. Agreement to Terms
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>By accessing, registering on, or using the SkillSense platform at careerguide.aisense.co.in, you agree to be bound by these Terms & Conditions. These Terms constitute a legally binding agreement under the Indian Contract Act, 1872 and are subject to the Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025.</p>
                <p>If you do not agree to these Terms, please do not use the platform.</p>
                <p>Platform Name: SkillSense Career Assessment Platform</p>
                <p>Operated By: AI Sense LLP</p>
                <p>Registered Address: Washim, Maharashtra, India</p>
                <p>Website: careerguide.aisense.co.in</p>
                </div>
            </motion.div>
            <motion.div id="sec_2" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                2. Definitions
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'Platform' means the SkillSense website at careerguide.aisense.co.in</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'AI Sense LLP' means the registered operator of the SkillSense platform</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'User' means any individual accessing or using the platform</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'Minor' means any user below 18 years of age (Juvenile Justice Act, 2015)</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'Assessment Credit' means a digital credit redeemable to unlock one Career Roadmap</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'Career Roadmap' means the personalised career guidance report generated after assessment</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'VERA' means the AI-powered career counsellor integrated into SkillSense</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'Data Fiduciary' means AI Sense LLP, as defined under the DPDP Act 2023</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>'DPBI' means the Data Protection Board of India</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_3" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                3. Eligibility
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>SkillSense is open to students from Class 6 through post-graduate level</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Users below 18 years of age must have verified parental or guardian consent before registration</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>By registering, you confirm that you meet these eligibility requirements or have obtained the required parental consent</span>
                </div>
                <p>Legal Basis: Section 9 - DPDP Act 2023 | Rule 10 - DPDP Rules 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_4" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                4. Platform Services
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP provides the following services through SkillSense:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>A free 42-question RIASEC-based career assessment</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>A personalised Career Roadmap unlocked via Assessment Credits</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA — an AI-powered career counselor built on the Anthropic API</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>An Assessment Credit system for purchasing and redeeming credits via Razorpay</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Gamification features: XP points, coins, streaks, and achievement badges</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Multi-language support: English, Hindi, and Marathi</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                5. Assessment Credit System
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>5.1 How Credits Work</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>1 Assessment Credit = 1 Career Roadmap unlock for one specific assessment attempt</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Taking the 42-question assessment is free and does not consume a credit</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Viewing the teaser or locked result preview does not consume a credit</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>A credit is deducted only when the user unlocks the full Career Roadmap for a specific assessment</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Once unlocked, that Career Roadmap remains permanently accessible from your account at no additional charge</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Each assessment attempt is independent; unlocking one does not unlock others</span>
                </div>
                <p>5.2 Pricing</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Rs 19 = 1 Assessment Credit</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Rs 599 = 30 Assessment Credits</span>
                </div>
                <p>Pricing is subject to change at the discretion of AI Sense LLP. Changes will be communicated on the platform before taking effect.</p>
                <p>5.3 Referral & Campaign Discounts</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Valid referral or campaign codes may be applied during credit purchase</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Codes may provide a percentage discount, fixed discount, or free credits</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>A 100% discount may result in a Rs 0 transaction, processed without a Razor pay payment gateway interaction</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Discounts do not change the standard credit mapping (1 credit = 1 roadmap unlock)</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_6" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                6. Payments
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>All payments are processed securely by Razor pay Payment Solutions Pvt. Ltd.</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP does NOT store your card number, CVV, or banking credentials — these are handled by Razor pay under PCI-DSS compliant infrastructure</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Payment metadata retained by SkillSense: Razor pay transaction ID, payment status, amount, date, and plan purchased — for booking verification and legal compliance</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>By making a payment, you agree to Razorpay's Terms of Service and Privacy Policy (available at razorpay.com)</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  Razor pay independently stores and manages payment card data. Refer to razorpay.com/privacy for their data handling practices. AI Sense LLP is not responsible for Razorpay's data storage.
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_7" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                7. Refund Policy
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP follows a NO REFUND policy for purchased Assessment Credits, except as mandated by applicable Indian law.</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Assessment Credits are non-refundable once purchased</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Unused credits remain in your account and do not expire</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>In the event of a verified technical error causing incorrect credit deduction (e.g., credit deducted without unlocking a roadmap), contact our Grievance Officer for review and remediation</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Where a payment is processed but credits are not allocated due to a system failure, you are</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_8" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                8. VERA AI Career Counselor — Disclaimer
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA is an AI-powered career counselor and provides general guidance and information only</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA's responses are generated by an AI model (Anthropic API) and are NOT a substitute for professional career counselling, academic advising, or psychological assessment</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP is not liable for any academic, career, or personal decisions made solely based on VERA's responses</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>VERA interactions are processed via Anthropic's enterprise API under a Data Processing Agreement; Anthropic does not train on user data by default</span>
                </div>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  VERA is a guidance tool, not a licensed career counselor. Always supplement AI-generated advice with guidance from qualified professionals.
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_9" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                9. User Conduct
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>All users of SkillSense agree NOT to:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Use the platform for any unlawful purpose</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Provide false identity information or misrepresent their academic level</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Share account credentials with any third party</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Attempt to reverse-engineer, hack, scrape, or disrupt the platform or its infrastructure</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Use automated tools to access, download, or replicate platform content</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Reproduce, sell, or commercially exploit Career Roadmap content or VERA responses</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_10" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                10. Data Privacy Obligations
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>By using SkillSense, you agree to:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Consent to data collection and processing as described in our Privacy Policy and Consent Form</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Not misuse any personal information accessed through the platform</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Report any suspected data breach or unauthorized access immediately to our Grievance Officer</span>
                </div>
                <p>AI Sense LLP's data practices are fully governed by the DPDP Act 2023 and DPDP Rules 2025. You may exercise your Data Principal rights at any time.</p>
                <p>Legal Basis: DPDP Act 2023 | DPDP Rules 2025 (notified 13 November 2025)</p>
                </div>
            </motion.div>
            <motion.div id="sec_11" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                11. Data Breach Response
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>In the event of a personal data breach involving SkillSense user data:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP will notify the Data Protection Board of India (DPBI) immediately upon discovery</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>All affected users will be notified within 72 hours with breach details and recommended protective steps (Rule 7, DPDP Rules 2025)</span>
                </div>
                <p>Users are required to report any suspected breach or unauthorized account access to our Grievance Officer immediately.</p>
                <div className="p-4 bg-[#FCE9C6]/50 rounded-xl border border-[#F2D28A] text-[#8A5E10] font-semibold text-sm">
                  ⚠  DPDP Rules 2025 Penalties: Breach notification failure - Up to Rs 200 crore. Inadequate security safeguards - Up to Rs 250 crore. Both penalties can apply simultaneously.
                </div>
                <p>Legal Basis: Section 8(6) - DPDP Act 2023 | Rule 7 - DPDP Rules 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_12" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                12. Intellectual Property
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>All content on SkillSense — including the RIASEC assessment framework implementation, Career Roadmap reports, VERA AI counselor, gamification system, platform design, and the SkillSense brand — is the intellectual property of AI Sense LLP.</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>You may not reproduce, distribute, resell, or commercially exploit any platform content without prior written permission from AI Sense LLP</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Career Roadmap reports are generated for personal use only and may not be published or shared commercially</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_13" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                13. Limitation of Liability
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP provides the SkillSense platform on an 'as-is' basis. To the maximum extent permitted by applicable Indian law:</p>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP is not liable for indirect, incidental, or consequential damages arising from platform use</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP does not guarantee uninterrupted or error-free service</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP is not liable for decisions made based solely on VERA's AI-generated responses</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Total liability shall not exceed the amount paid by the user in the 3 months preceding the claim</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_14" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                14. Termination
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>AI Sense LLP may suspend or terminate accounts that violate these Terms, with or without prior notice</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Users may request account deletion at any time by contacting our Grievance Officer</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Upon termination or deletion, user data will be handled per our Privacy Policy and DPDP Act 2023 obligations</span>
                </div>
                <div className="flex items-start gap-2 ml-4">
                  <span className="text-[#09A3A3] mt-0.5">•</span>
                  <span>Unused credits at the time of account deletion are forfeited and are not eligible for refund</span>
                </div>
                </div>
            </motion.div>
            <motion.div id="sec_15" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                15. Governing Law & Jurisdiction
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>These Terms are governed by the laws of India, including the Indian Contract Act 1872, the Digital Personal Data Protection Act 2023, and DPDP Rules 2025. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in:</p>
                <p>Jurisdiction: Shegaon, Maharashtra, India</p>
                </div>
            </motion.div>
            <motion.div id="sec_16" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                16. Grievance Redressal
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>For disputes, complaints, technical issues, or data rights requests:</p>
                <p>Organisation: AI Sense LLP</p>
                <p>Grievance Officer: Designated Grievance Officer, AI Sense LLP</p>
                <p>Address: Washim, Maharashtra, India</p>
                <p>All grievances will be resolved within 90 days of receipt as mandated by Rule 14 of the DPDP Rules 2025. Unresolved complaints may be escalated to the Data Protection Board of India (DPBI).</p>
                <p>Escalation Authority: Data Protection Board of India (DPBI) | Rule 14 - DPDP Rules 2025</p>
                </div>
            </motion.div>
            <motion.div id="sec_17" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
              <h2 className="text-xl sm:text-2xl font-bold text-[#04302E] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#09A3A3]" />
                17. Changes to These Terms
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[#12302D]/80 leading-relaxed font-medium">
        <p>AI Sense LLP may update these Terms periodically to reflect changes in the platform, our practices, or regulatory requirements. Material changes will be communicated via platform notification or email with a minimum of 15 days' notice before taking effect. Continued use of the platform after changes constitutes your acceptance of the updated Terms.</p>
                <p>AI Sense LLP  |  Washim, Maharashtra, India  |  careerguide.aisense.co.in</p>
                <p>Available in: English | Hindi | Marathi</p>
                <p>Governed by: DPDP Act 2023 & DPDP Rules 2025 (notified 13 November 2025)  |  Enforcement: 13 May 2027</p>
                <p>Regulatory Authority: Data Protection Board of India (DPBI)  |  Jurisdiction: Shegaon, Maharashtra</p>
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
