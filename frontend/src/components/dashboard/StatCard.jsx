import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Unlock, Coins, IndianRupee, Megaphone, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ICONS = {
  'total-users': Users,
  assessments: CheckCircle2,
  unlocked: Unlock,
  'credits-sold': Coins,
  revenue: IndianRupee,
  campaigns: Megaphone,
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Parses a display value like "₹509.80" or 89 into { prefix, number, suffix, decimals }
function parseValue(value) {
  if (value === null || value === undefined) return { prefix: '', number: 0, suffix: '', decimals: 0 };
  const str = String(value).trim();
  const match = str.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: '', number: 0, suffix: str, decimals: 0 };
  const [, prefix, numStr, suffix] = match;
  const clean = numStr.replace(/,/g, '');
  const decimals = clean.includes('.') ? clean.split('.')[1].length : 0;
  const parsedNum = parseFloat(clean);
  return {
    prefix: prefix || '',
    number: isNaN(parsedNum) ? 0 : Math.max(0, parsedNum),
    suffix: suffix || '',
    decimals,
  };
}

function CountUpValue({ value }) {
  const { prefix, number, suffix, decimals } = parseValue(value);
  const [display, setDisplay] = useState(number);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;
    const duration = 800;
    const startVal = 0;
    const endVal = number;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + (endVal - startVal) * eased);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplay(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [number]);

  const safeDisplay = Math.max(0, isNaN(display) ? 0 : display);
  const formatted =
    decimals > 0
      ? safeDisplay.toFixed(decimals)
      : Math.round(safeDisplay).toLocaleString('en-IN');

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function Sparkline({ trend = [], positive }) {
  if (!trend || !trend.length) return null;
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const range = max - min || 1;
  const w = 56;
  const h = 26;
  const step = w / (trend.length - 1 || 1);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      {trend.map((v, i) => {
        const barH = 4 + ((v - min) / range) * (h - 4);
        return (
          <rect
            key={i}
            x={i * step}
            y={h - barH}
            width={Math.max(2, step - 2)}
            height={barH}
            rx={1.5}
            className={i === trend.length - 1 ? (positive ? 'fill-emerald-500' : 'fill-rose-400') : 'fill-teal-deep/15'}
          />
        );
      })}
    </svg>
  );
}

export default function StatCard({ label, value, caption, index = 0, id, delta, trend }) {
  const Icon = ICONS[id] || Users;
  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl shadow-sm border border-teal-900/10 p-5 relative overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 max-w-[75%] leading-snug">{label}</p>
        <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-teal-100">
          <Icon className="h-4 w-4 text-[#09A3A3]" />
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0B1F1D]">
          <CountUpValue value={value} />
        </p>
        <Sparkline trend={trend} positive={positive} />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {typeof delta === 'number' && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              positive ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        <span className="text-xs text-gray-400 truncate">{caption}</span>
      </div>
    </motion.div>
  );
}
