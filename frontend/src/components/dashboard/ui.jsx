// Small shared presentational primitives used across dashboard sections.
import { motion } from 'framer-motion';

export function SectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-card border border-teal-deep/5 ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({ status }) {
  const active = status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        active ? 'bg-emerald-50 text-emerald-600' : 'bg-ink/5 text-ink/40'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-ink/30'}`} />
      {status}
    </span>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center gap-2 bg-teal-gradient text-white font-medium text-sm
      px-5 py-2.5 rounded-full shadow-card
      disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function DangerButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center gap-2 bg-red-500 text-white font-medium text-sm
      px-5 py-2.5 rounded-full shadow-card hover:bg-red-600 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center gap-2 bg-transparent text-ink/60 font-medium text-sm
      px-5 py-2.5 rounded-full border border-teal-deep/15 hover:bg-mist-light ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block mb-4 last:mb-0">
      <span className="block text-sm font-medium text-ink/75 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink/40 mt-1.5">{hint}</span>}
    </label>
  );
}

export const inputClasses =
  'w-full bg-mist-light border border-teal-deep/12 rounded-lg px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-teal-deep/25 focus:border-teal-deep/30 ' +
  'transition-colors';

export function ProgressBar({ value, max, className = '' }) {
  const pct = (max !== undefined && max !== null)
    ? (max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0)
    : Math.min(100, Math.max(0, Math.round(value || 0)));
  return (
    <div className={`h-1.5 w-full bg-mist-light rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="h-full bg-teal-gradient-r rounded-full"
      />
    </div>
  );
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, className = '' }) {
  return (
    <div
      className={`h-10 w-10 shrink-0 rounded-full bg-teal-gradient flex items-center justify-center text-white text-xs font-heading font-semibold ${className}`}
    >
      {initials(name)}
    </div>
  );
}
