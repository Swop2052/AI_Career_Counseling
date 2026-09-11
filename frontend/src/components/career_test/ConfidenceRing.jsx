export default function ConfidenceRing({ value, color }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#FFFFFF" strokeWidth="5" opacity="0.6" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          className="qm-conf-circle"
          style={{ "--circ": circ, "--offset": offset, strokeDashoffset: offset }}
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold text-slate-700">{value}%</span>
    </div>
  );
}
