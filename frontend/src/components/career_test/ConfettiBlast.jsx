import { useMemo } from "react";

// A one-shot confetti "blast" — a burst of colored pieces that fly outward
// from the center and fall with gravity + rotation, Duolingo-style. Pure
// CSS animation (see QuizAnimations.jsx for keyframes), no canvas/deps.
const COLORS = ["#6366F1", "#F59E0B", "#22C55E", "#EC4899", "#06B6D4", "#F43F5E", "#A855F7"];
const SHAPES = ["qm-confetti-rect", "qm-confetti-circle"];

export default function ConfettiBlast({ count = 90 }) {
  const pieces = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const angle = Math.random() * 360;
      const distance = 120 + Math.random() * 260;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance * 0.6 - 40; // biased upward on first phase
      const fall = 260 + Math.random() * 220;
      const delay = Math.random() * 0.25;
      const duration = 1.6 + Math.random() * 1.1;
      const spin = 360 * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
      const color = COLORS[i % COLORS.length];
      const shape = SHAPES[i % SHAPES.length];
      const size = 6 + Math.random() * 7;
      return { id: i, tx, ty, fall, delay, duration, spin, color, shape, size, left: 50 + (Math.random() * 10 - 5) };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`qm-confetti-piece ${p.shape}`}
          style={{
            left: `${p.left}%`,
            top: "38%",
            background: p.color,
            width: p.shape === "qm-confetti-circle" ? p.size : p.size * 0.55,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--fall": `${p.fall}px`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
