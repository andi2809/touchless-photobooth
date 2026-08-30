'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CapturedPhoto } from '@/types/photobooth';
import { Sparkles, X, Heart } from 'lucide-react';

interface PolaroidPopupProps {
  photo: CapturedPhoto | null;
  onDismiss: () => void;
  autoDismissSeconds?: number;
}

export const PolaroidPopup: React.FC<PolaroidPopupProps> = ({
  photo,
  onDismiss,
  autoDismissSeconds = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(autoDismissSeconds);

  // Trigger confetti burst and celebration when a new photo arrives
  useEffect(() => {
    if (!photo) return;
    setTimeLeft(autoDismissSeconds);

    // Multi-stage confetti celebration
    try {
      // Stage 1: Big center burst
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.45, x: 0.5 },
        colors: ['#f472b6', '#fbbf24', '#38bdf8', '#a855f7', '#ffffff'],
        startVelocity: 45,
      });

      // Stage 2: Left and right sparkles
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 60,
          origin: { x: 0.15, y: 0.6 },
          colors: ['#ec4899', '#fde047', '#60a5fa'],
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 60,
          origin: { x: 0.85, y: 0.6 },
          colors: ['#ec4899', '#fde047', '#60a5fa'],
        });
      }, 250);
    } catch (e) {
      console.warn('[Celebration] Confetti failed:', e);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [photo, autoDismissSeconds, onDismiss]);

  if (!photo) return null;

  return (
    <aside aria-label="Notifikasi Foto Baru" className="fixed top-16 sm:top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none animate-popIn">
      <div className="relative px-6 py-3 rounded-full bg-amber-300 text-slate-950 border-3 border-slate-900 shadow-[0_10px_25px_rgba(0,0,0,0.2),0_4px_0_#0f172a] flex items-center gap-3">
        {/* Left Sparkle Badge */}
        <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-200" />
        </div>

        {/* Text Announcement */}
        <div className="flex flex-col text-left pr-2">
          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-tight text-slate-900 uppercase">
            <span>🎉 Foto Baru Selesai! 🎉</span>
          </div>
          <span className="text-[11px] font-bold text-slate-800">
            Tampil di Hero & siap diunduh! ✨
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="p-1 rounded-full bg-white hover:bg-slate-100 border border-slate-900 text-slate-700 transition ml-1"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
