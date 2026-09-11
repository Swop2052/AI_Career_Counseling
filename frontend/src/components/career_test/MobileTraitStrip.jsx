import { Check } from "lucide-react";
import Visual from "./Visual.jsx";

export default function MobileTraitStrip({ categoryStats }) {
  return (
    <div className="lg:hidden w-full max-w-lg px-4 sm:px-5 pb-1 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {categoryStats.map((c) => (
        <div
          key={c.cat}
          className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full border transition-colors"
          style={{
            background: c.isCurrent ? c.info.tint : "#FFFFFF",
            borderColor: c.isCurrent ? c.info.color : "#EEF1F5",
          }}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
            style={{ background: c.isDone ? c.info.color : c.info.tint }}
          >
            {c.isDone ? (
              <Check size={10} strokeWidth={3} className="text-white" />
            ) : (
              <Visual value={c.info.emoji} className="w-3 h-3 object-contain" />
            )}
          </span>
          <span
            className="text-[10px] font-extrabold"
            style={{ color: c.isCurrent ? c.info.color : "#94A3B8", fontFamily: "'Baloo 2', sans-serif" }}
          >
            {c.cat}
          </span>
        </div>
      ))}
    </div>
  );
}
