import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';

/**
 * CanonicalModal - The authoritative, reusable SkillSense modal component.
 * 
 * Features:
 * - Always mounts via React Portal directly to document.body (escapes any parent stacking contexts)
 * - Layered at z-[9999]
 * - Accessible: role="dialog", aria-modal="true", keyboard focus trapping, Escape key handler
 * - Robust scroll lock on body (saves & restores previous scroll offset & overflow)
 * - Guaranteed click / pointer events: zero inert or pointer-events hacks on #root
 * - Responsive on desktop, tablet, and mobile
 */
export default function CanonicalModal({
  isOpen = false,
  onClose = null,
  icon: Icon = Sparkles,
  iconGradient = 'from-[#09A3A3] to-[#04302E]',
  eyebrow = 'ASSESSMENT SAVED',
  eyebrowColor = 'text-[#09A3A3] bg-teal-50',
  title = 'Credits Required to Unlock',
  balance = null,
  description = 'Credits are required to unlock this career report. Buy 1 credit to reveal your personalized career roadmap and detailed trait breakdown.',
  error = null,
  primaryAction = null,   // { label: 'Buy Credits', onClick: () => {}, icon?: ArrowRight, loading?: false, disabled?: false }
  secondaryAction = null, // { label: 'Not Now', onClick: () => {}, disabled?: false }
  footerText = 'Your assessment is securely saved. You can unlock it anytime from My Profile.',
  showCloseButton = false,
  children = null
}) {
  const modalRef = useRef(null);
  const primaryBtnRef = useRef(null);

  // Safe body scroll lock and keyboard focus trap
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const origOverflow = document.body.style.overflow;
    const origPosition = document.body.style.position;
    const origTop = document.body.style.top;
    const origWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Focus primary button or modal container
    const focusTimer = setTimeout(() => {
      if (primaryBtnRef.current) {
        primaryBtnRef.current.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap Tab focus inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
      document.body.style.position = origPosition;
      document.body.style.top = origTop;
      document.body.style.width = origWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const PrimaryIcon = primaryAction?.icon || ArrowRight;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#04211F]/50 backdrop-blur-md overflow-y-auto"
      style={{ fontFamily: "'Inter', sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="canonical-modal-title"
      aria-describedby="canonical-modal-desc"
      onClick={(e) => {
        // Prevent accidental backdrop close unless explicitly desired
        if (e.target === e.currentTarget && typeof onClose === 'function') {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-gray-100 z-10 text-center animate-[scaleUp_0.2s_ease-out] focus:outline-none"
      >
        {/* Optional Close "X" Button */}
        {showCloseButton && typeof onClose === 'function' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Centered Rounded Gradient Icon Container */}
        {Icon && (
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center mx-auto mb-4 shadow-lg text-white`}
          >
            <Icon className="w-8 h-8" />
          </div>
        )}

        {/* Uppercase Eyebrow Status Badge */}
        {eyebrow && (
          <span
            className={`inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 ${eyebrowColor}`}
          >
            {eyebrow}
          </span>
        )}

        {/* Strong Dark Heading */}
        <h2
          id="canonical-modal-title"
          className="text-xl sm:text-2xl font-bold text-[#04211F] mb-2 tracking-tight"
        >
          {title}
        </h2>

        {/* Optional Credit Balance Pill */}
        {balance !== null && balance !== undefined && (
          <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 mb-4 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span>Available Balance:</span>
            <span className="font-bold">
              {balance} {balance === 1 ? 'Credit' : 'Credits'}
            </span>
          </div>
        )}

        {/* Readable Supporting Description */}
        {description && (
          <p
            id="canonical-modal-desc"
            className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto"
          >
            {description}
          </p>
        )}

        {/* Optional Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200 text-center">
            {error}
          </div>
        )}

        {/* Custom Children (if any) */}
        {children}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {primaryAction && (
            <button
              ref={primaryBtnRef}
              type="button"
              disabled={primaryAction.disabled || primaryAction.loading}
              onClick={primaryAction.onClick}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#084b48] via-[#04302E] to-[#09A3A3] text-white text-sm font-extrabold shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {primaryAction.loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                <>
                  <span>{primaryAction.label}</span>
                  {PrimaryIcon && <PrimaryIcon className="w-4 h-4 shrink-0" />}
                </>
              )}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
              className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-colors cursor-pointer text-center disabled:opacity-50"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>

        {/* Footer / Helper Text */}
        {footerText && (
          <p className="text-[11px] text-gray-400 mt-4 leading-normal">
            {footerText}
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
