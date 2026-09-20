import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, AlertCircle, Loader2 } from 'lucide-react';
import Reveal from '../Reveal';
import { useLanguage } from '../../translations/LanguageContext';

// Card entrance animation
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.85, rotate: -4 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.12,
      type: 'spring',
      stiffness: 260,
      damping: 18,
      mass: 0.9,
    },
  }),
};

// Form fields entrance animation
const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const getContactInfo = (t) => [
  { icon: Mail, title: t('emailUs'), value: 'hello@skillsense.com' },
  { icon: Phone, title: t('callUs'), value: '+91 98765 43210' },
  { icon: MapPin, title: t('visitUs'), value: 'Mumbai, Maharashtra, India' },
];

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          website: form.website || '',
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Failed to send message. Please try again later.');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', message: '', website: '' });
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 md:scroll-mt-24 relative bg-white">
      {/* Top wave divider */}
      <div className="w-full leading-[0] text-[#CFEDED]">
        <svg
          className="w-full h-[40px] sm:h-[80px] md:h-[120px] block"
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0,50 C180,110 360,20 600,60 C840,100 1020,10 1260,70 C1350,92 1410,85 1440,75 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <div className="relative pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 md:px-10">
        {/* Background glow */}
        <motion.div
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-[#09A3A3]/10 blur-[90px]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <Reveal className="text-center mb-10 sm:mb-16">
            <div className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#078686] uppercase mb-2 sm:mb-3">
              {t('contactBadge')}
            </div>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-[#04211F] tracking-tight">
              {t('contactHeading')}
            </h2>
            <p className="text-sm sm:text-base text-[#0B3D3D]/65 mt-2 sm:mt-3 max-w-md mx-auto">
              {t('contactDesc')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            {/* Left: Contact Info */}
            <div className="flex flex-col gap-5 sm:gap-6">
              {getContactInfo(t).map((item, i) => (
                <motion.div
                  key={item.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                  whileHover={{
                    y: -6,
                    scale: 1.02,
                    transition: { type: 'spring', stiffness: 300, damping: 15 },
                  }}
                  className="relative flex gap-4 sm:gap-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#09A3A3]/15 shadow-lg shadow-[#04302E]/15 hover:shadow-xl hover:shadow-[#09A3A3]/30 hover:border-[#09A3A3]/35 transition-shadow duration-300 transform-gpu"
                >
                  <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#09A3A3] to-[#04302E] text-white flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-base sm:text-lg text-[#04211F] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#0B3D3D]/65">
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#09A3A3]/15 shadow-lg shadow-[#09A3A3]/10 overflow-hidden">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      className="flex flex-col items-center justify-center text-center py-10"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                        className="w-14 h-14 rounded-full bg-[#CFEDED] flex items-center justify-center mb-4"
                      >
                        <Send className="w-6 h-6 text-[#078686]" />
                      </motion.div>
                      <h3 className="font-display font-semibold text-lg text-[#04211F] mb-1">
                        {t('messageSent')}
                      </h3>
                      <p className="text-sm text-[#0B3D3D]/65">
                        {t('successDesc')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setErrorMessage('');
                        }}
                        className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-[#078686] bg-[#CFEDED]/50 hover:bg-[#CFEDED] transition-colors cursor-pointer"
                      >
                        Send Another Message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4"
                    >
                      <input
                        type="text"
                        name="website"
                        value={form.website || ''}
                        onChange={handleChange}
                        tabIndex="-1"
                        autoComplete="off"
                        className="hidden"
                        aria-hidden="true"
                      />
                      {errorMessage && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{errorMessage}</span>
                        </div>
                      )}
                      {[
                        { id: 'name', label: t('nameLabel'), type: 'text', placeholder: 'Your name' },
                        { id: 'email', label: t('emailLabel'), type: 'email', placeholder: 'you@example.com' },
                      ].map((field, i) => (
                        <motion.div
                          key={field.id}
                          custom={i}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          variants={fieldVariants}
                        >
                          <label
                            htmlFor={field.id}
                            className="block text-xs font-semibold text-[#04211F] mb-1.5"
                          >
                            {field.label}
                          </label>
                          <motion.input
                            id={field.id}
                            name={field.id}
                            type={field.type}
                            required
                            value={form[field.id]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            whileFocus={{ scale: 1.015 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="w-full rounded-xl border border-[#09A3A3]/20 bg-[#CFEDED]/20 px-4 py-2.5 text-sm text-[#04211F] placeholder:text-[#0B3D3D]/40 outline-none focus:border-[#09A3A3] focus:ring-2 focus:ring-[#09A3A3]/20 transition-colors"
                          />
                        </motion.div>
                      ))}

                      <motion.div
                        custom={2}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fieldVariants}
                      >
                        <label
                          htmlFor="message"
                          className="block text-xs font-semibold text-[#04211F] mb-1.5"
                        >
                          {t('messageLabel')}
                        </label>
                        <motion.textarea
                          id="message"
                          name="message"
                          required
                          rows={4}
                          value={form.message}
                          onChange={handleChange}
                          placeholder="How can we help?"
                          whileFocus={{ scale: 1.015 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className="w-full rounded-xl border border-[#09A3A3]/20 bg-[#CFEDED]/20 px-4 py-2.5 text-sm text-[#04211F] placeholder:text-[#0B3D3D]/40 outline-none focus:border-[#09A3A3] focus:ring-2 focus:ring-[#09A3A3]/20 transition-colors resize-none"
                        />
                      </motion.div>

                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        custom={3}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fieldVariants}
                        whileHover={isSubmitting ? {} : {
                          y: -2,
                          scale: 1.02,
                          transition: { type: 'spring', stiffness: 300, damping: 15 },
                        }}
                        whileTap={isSubmitting ? {} : { scale: 0.97 }}
                        className={`mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#09A3A3] to-[#04302E] text-white font-semibold text-sm px-6 py-3 shadow-md shadow-[#09A3A3]/30 hover:shadow-lg hover:shadow-[#09A3A3]/40 transition-all duration-300 ${
                          isSubmitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <span>Sending...</span>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            {t('sendMessage')}
                            <motion.span
                              animate={{ x: [0, 3, 0] }}
                              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                              className="flex"
                            >
                              <Send className="w-4 h-4" />
                            </motion.span>
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="w-full leading-[0] text-[#CFEDED]">
        <svg
          className="w-full h-[40px] sm:h-[80px] md:h-[120px] block"
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0,50 C180,110 360,20 600,60 C840,100 1020,10 1260,70 C1350,92 1410,85 1440,75 L1440,130 L0,130 Z" />
        </svg>
      </div>
    </section>
  );
}