import React from "react";

export default function QuizAnimations() {
  return (
    <style>{`
      @keyframes qm-pop {
        0% { transform: scale(1) translateY(0); }
        35% { transform: scale(0.96) translateY(2px); }
        65% { transform: scale(1.03) translateY(-2px); }
        100% { transform: scale(1) translateY(0); }
      }
      @keyframes qm-option-slide-in {
        0% { opacity: 0; transform: translateY(16px) scale(0.96); }
        70% { transform: translateY(-2px) scale(1.01); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes qm-emoji-pop {
        0% { transform: scale(1) rotate(0deg); }
        30% { transform: scale(1.35) rotate(-12deg); }
        65% { transform: scale(0.95) rotate(6deg); }
        100% { transform: scale(1.1) rotate(0deg); }
      }
      @keyframes qm-check-pop {
        0% { transform: scale(0) rotate(-45deg); opacity: 0; }
        60% { transform: scale(1.3) rotate(8deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes qm-burst {
        0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1.1); opacity: 0; }
      }
      @keyframes qm-wave-wing {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(-28deg) translateY(-2px); }
      }
      @keyframes qm-toast-in {
        0% { transform: translateY(32px) scale(0.88); opacity: 0; }
        60% { transform: translateY(-6px) scale(1.03); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes qm-mascot-bounce-in {
        0% { transform: translateY(80px) scale(0.4) rotate(-10deg); opacity: 0; }
        50% { transform: translateY(-12px) scale(1.08) rotate(4deg); opacity: 1; }
        75% { transform: translateY(4px) scale(0.98) rotate(-1deg); }
        100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes qm-mascot-bounce-out {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(50px) scale(0.5); opacity: 0; }
      }
      @keyframes qm-mascot-squash {
        0%, 100% { transform: scale(1, 1) translateY(0); }
        30% { transform: scale(1.12, 0.88) translateY(3px); }
        55% { transform: scale(0.92, 1.12) translateY(-8px); }
        75% { transform: scale(1.03, 0.97) translateY(0); }
      }
      @keyframes qm-mascot-glow {
        0%, 100% { transform: scale(0.92); opacity: 0.25; filter: blur(4px); }
        50% { transform: scale(1.18); opacity: 0.55; filter: blur(8px); }
      }
      @keyframes qm-mascot-spark {
        0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translate(-14px, -18px) scale(1.2) rotate(45deg); opacity: 0; }
      }
      @keyframes qm-blink {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }
      @keyframes qm-bubble-in {
        0% { transform: scale(0.5) translateX(12px); opacity: 0; }
        70% { transform: scale(1.06) translateX(-2px); opacity: 1; }
        100% { transform: scale(1) translateX(0); opacity: 1; }
      }
      @keyframes qm-intro-float {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.02); }
      }
      @keyframes qm-intro-ring {
        0% { transform: scale(0.7); opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes qm-overlay-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      @keyframes qm-overlay-out { 0% { opacity: 1; } 100% { opacity: 0; } }
      @keyframes qm-popup-in {
        0% { transform: scale(0.65) translateY(30px); opacity: 0; }
        60% { transform: scale(1.04) translateY(-4px); opacity: 1; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes qm-popup-out {
        0% { transform: scale(1) translateY(0); opacity: 1; }
        100% { transform: scale(0.8) translateY(16px); opacity: 0; }
      }
      @keyframes qm-progress-pop {
        0% { transform: scaleY(1); }
        45% { transform: scaleY(1.35); }
        100% { transform: scaleY(1); }
      }
      @keyframes qm-shine-sweep {
        0% { transform: translateX(-150%) skewX(-25deg); }
        100% { transform: translateX(250%) skewX(-25deg); }
      }
      @keyframes qm-ring-pulse {
        0% { transform: scale(0.8); opacity: 0.6; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      @keyframes qm-icon-pop {
        0% { transform: scale(0) rotate(-20deg); opacity: 0; }
        60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes qm-sparkle-float {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.75; }
        50% { transform: translateY(-8px) scale(1.2); opacity: 1; }
      }
      @keyframes qm-confetti-fly {
        0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); opacity: 1; }
        35% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(calc(var(--spin) * 0.45)); opacity: 1; }
        100% { transform: translate(-50%, -50%) translate(var(--tx), calc(var(--ty) + var(--fall))) rotate(var(--spin)); opacity: 0; }
      }
      @keyframes qm-fade-up {
        0% { opacity: 0; transform: translateY(14px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .qm-selected { animation: qm-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .qm-option-in { animation: qm-option-slide-in 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      .qm-emoji-pop { animation: qm-emoji-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .qm-check-pop { animation: qm-check-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .qm-particle { animation: qm-burst 0.55s ease-out forwards; }
      .qm-toast { animation: qm-toast-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .qm-progress-fill { animation: qm-progress-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .qm-progress-shine { animation: qm-shine-sweep 2s ease-in-out infinite; }
      .qm-mascot-enter { animation: qm-mascot-bounce-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      .qm-mascot-exit { animation: qm-mascot-bounce-out 0.22s ease-in forwards; }
      .qm-mascot-squash { animation: qm-mascot-squash 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
      .qm-mascot-glow { animation: qm-mascot-glow 1.2s ease-in-out infinite; }
      .qm-mascot-spark { animation: qm-mascot-spark 1.4s ease-out infinite; }
      .qm-blink { animation: qm-blink 4.5s ease-in-out infinite; transform-origin: center; }
      .qm-bubble-in { animation: qm-bubble-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      .qm-intro-float { animation: qm-intro-float 2.8s ease-in-out infinite; }
      .qm-intro-ring { animation: qm-intro-ring 1.8s ease-out infinite; }
      .qm-overlay-enter { animation: qm-overlay-in 0.22s ease-out forwards; }
      .qm-overlay-exit { animation: qm-overlay-out 0.2s ease-in forwards; }
      .qm-popup-enter { animation: qm-popup-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      .qm-popup-exit { animation: qm-popup-out 0.2s ease-in forwards; }
      .qm-ring { animation: qm-ring-pulse 1.8s ease-out infinite; }
      .qm-icon-pop { animation: qm-icon-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      .qm-sparkle { animation: qm-sparkle-float 2.2s ease-in-out infinite; }
      .qm-fade-up { animation: qm-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .qm-confetti-piece { position: absolute; animation: qm-confetti-fly ease-out forwards; }
      .qm-confetti-rect { border-radius: 3px; }
      .qm-confetti-circle { border-radius: 50%; }
    `}</style>
  );
}