import { useEffect, useRef } from "react";

// Tracks every setTimeout the quiz schedules so a fast "back" tap or restart
// can cancel pending advances/animations instead of letting stale timers fire.
export function useTimers() {
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const after = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  return { clearTimers, after };
}
