'use client';

import React from 'react';
import { CaptureStage } from '@/types/photobooth';

interface CountdownOverlayProps {
  countdown: number | null; // 3, 2, 1
  stage: CaptureStage;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown, stage }) => {
  if (stage !== 'LOCKED_COUNTDOWN' || countdown === null) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-30 animate-fadeIn">
      {/* Locked Focus Banner */}
      <div className="mb-6 px-6 py-2 rounded-full bg-black/80 border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(0,255,102,0.5)] backdrop-blur-md flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-emerald-300 font-bold text-sm sm:text-base tracking-wide">
          🔒 Area Fokus Terkunci! Silakan Berpose Bebas 📸
        </span>
      </div>

      {/* Giant Countdown Number */}
      <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-black/70 border-4 border-neon-gold shadow-neon-gold backdrop-blur-xl animate-bounce">
        <span className="text-8xl sm:text-9xl font-black text-neon-gold tracking-tight font-mono drop-shadow-[0_0_30px_rgba(255,230,0,1)]">
          {countdown}
        </span>
      </div>

      {/* Smile / Pose prompt */}
      <p className="mt-6 px-5 py-1.5 rounded-full bg-slate-900/85 border border-white/20 text-white font-semibold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md">
        ✨ Katakan &quot;PTI BEMP!&quot; ✨
      </p>
    </div>
  );
};
