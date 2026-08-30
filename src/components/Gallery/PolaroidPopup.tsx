'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CapturedPhoto } from '@/types/photobooth';
import { Sparkles, Download, X } from 'lucide-react';

interface PolaroidPopupProps {
  photo: CapturedPhoto | null;
  onDismiss: () => void;
  autoDismissSeconds?: number;
}

export const PolaroidPopup: React.FC<PolaroidPopupProps> = ({
  photo,
  onDismiss,
  autoDismissSeconds = 4,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(autoDismissSeconds);

  // Trigger confetti burst and countdown when a new photo appears
  useEffect(() => {
    if (!photo) return;
    setTimeLeft(autoDismissSeconds);

    // Fire celebratory confetti explosion
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff007f', '#ffe600', '#00ff66', '#ffffff'],
      });
    } catch (e) {
      console.warn('[PolaroidPopup] Confetti failed:', e);
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `PTI-BEMP-GALLERY-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPercent = (timeLeft / autoDismissSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Container */}
      <div className="relative flex flex-col items-center max-w-2xl w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-neon-cyan rounded-3xl p-6 shadow-neon-cyan animate-scaleUp">
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Celebration Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-xs font-bold uppercase tracking-wider mb-4 shadow-neon-cyan animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Foto Baru Masuk! 🎉</span>
        </div>

        {/* Polaroid Frame Card */}
        <div className="w-full bg-white p-3 sm:p-4 rounded-2xl shadow-2xl transform transition-transform hover:scale-[1.01]">
          {/* Photo */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageDataUrl}
              alt="Live Snapshot"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Polaroid Caption */}
          <div className="mt-3 flex items-center justify-between px-2 text-slate-800">
            <div>
              <p className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                ID: {photo.id}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">{photo.formattedTime}</p>
            </div>
            <span className="font-bold text-xs text-blue-600 tracking-wide">
              PTI BEMP PHOTOBOOTH
            </span>
          </div>
        </div>

        {/* Bottom Timer & Actions */}
        <div className="w-full mt-5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {/* Countdown progress bar */}
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-neon-cyan transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px]">Masuk ke galeri ({timeLeft}s)</span>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-cyan-400/40 text-xs font-semibold shadow-neon-cyan transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
