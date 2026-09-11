import { useEffect, useRef, useState } from "react";

export function useQuizSounds() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const playTone = (
    freq,
    { duration = 0.12, type = "sine", delay = 0, gain = 0.18, pitchDrop = false, pitchRise = false } = {}
  ) => {
    if (mutedRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const t0 = ctx.currentTime + delay;

    if (pitchRise) {
      osc.frequency.setValueAtTime(freq * 0.7, t0);
      osc.frequency.exponentialRampToValueAtTime(freq, t0 + duration * 0.4);
    } else if (pitchDrop) {
      osc.frequency.setValueAtTime(freq * 1.3, t0);
      osc.frequency.exponentialRampToValueAtTime(freq, t0 + duration);
    } else {
      osc.frequency.setValueAtTime(freq, t0);
    }

    osc.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration + 0.04);
  };

  const playSelectBeep = (optionValue = 3) => {
    const baseFreq = 440 + optionValue * 70;
    playTone(baseFreq * 1.4, { duration: 0.08, type: "sine", gain: 0.22, pitchDrop: true });
    playTone(baseFreq * 2, { duration: 0.14, type: "triangle", delay: 0.02, gain: 0.12, pitchRise: true });
    if (optionValue >= 4) {
      playTone(1318.5, { duration: 0.22, type: "sine", delay: 0.06, gain: 0.15 });
      playTone(1567.98, { duration: 0.26, type: "sine", delay: 0.11, gain: 0.12 });
    }
  };

  const playCategoryChime = () => {
    playTone(523.25, { duration: 0.18, type: "sine", delay: 0.0, gain: 0.16 });
    playTone(659.25, { duration: 0.18, type: "sine", delay: 0.08, gain: 0.18 });
    playTone(783.99, { duration: 0.22, type: "triangle", delay: 0.16, gain: 0.2 });
    playTone(1046.5, { duration: 0.45, type: "sine", delay: 0.25, gain: 0.24 });
    playTone(1318.5, { duration: 0.45, type: "triangle", delay: 0.27, gain: 0.12 });
    playTone(1567.98, { duration: 0.5, type: "sine", delay: 0.3, gain: 0.14 });
  };

  const playMascotChime = () => {
    playTone(587.33, { duration: 0.12, type: "sine", gain: 0.18, pitchRise: true });
    playTone(880, { duration: 0.14, type: "triangle", delay: 0.06, gain: 0.2, pitchRise: true });
    playTone(1174.66, { duration: 0.22, type: "sine", delay: 0.12, gain: 0.22 });
  };

  const playTapClick = () => {
    playTone(800, { duration: 0.04, type: "triangle", gain: 0.09, pitchDrop: true });
  };

  return { muted, setMuted, playSelectBeep, playCategoryChime, playMascotChime, playTapClick };
}