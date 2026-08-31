'use client';

import React from 'react';
import { Monitor, Laptop, Sparkles, Smartphone, MoveHorizontal, AlertTriangle } from 'lucide-react';

interface DesktopBlockerOverlayProps {
  windowWidth?: number;
  minWidth?: number;
  title?: string;
  description?: string;
}

export const DesktopBlockerOverlay: React.FC<DesktopBlockerOverlayProps> = ({
  windowWidth = 0,
  minWidth = 1024,
  title = 'Layar Terlalu Kecil',
  description = 'Aplikasi Touchless Photobooth ini dirancang khusus untuk layar besar (Desktop, Laptop, atau Kiosk Pameran) dengan kontrol interaksi AI gestur tangan bebas sentuh.',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-slate-100 backdrop-blur-2xl select-none overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Modal Card */}
      <div className="relative max-w-md w-full p-8 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col items-center text-center backdrop-blur-xl animate-fade-in">
        
        {/* Playful Stickers on corners */}
        <div className="absolute -top-4 -right-3 rotate-12 px-3 py-1 bg-pink-400 text-slate-950 font-black text-[10px] rounded-full border border-slate-900 shadow-md uppercase tracking-wider">
          Desktop Only 💻
        </div>

        {/* Hero Device Comparison Icon */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 border-2 border-pink-400/40 shadow-inner">
            <Monitor className="w-12 h-12 text-pink-400 animate-pulse" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-bounce" />
          </div>
          
          {/* Mini mobile restricted badge */}
          <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-500/90 text-white border-2 border-slate-900 shadow-md">
            <Smartphone className="w-4 h-4 opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-white rotate-45" />
            </div>
          </div>
        </div>

        {/* Badge Status */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-bold mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Pengalaman Terbaik di Layar Besar</span>
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          {title}
        </h1>

        {/* Friendly Explanation */}
        <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-6 font-medium">
          {description} Silakan buka website ini melalui <strong>PC</strong> atau <strong>Laptop</strong> untuk pengalaman maksimal.
        </p>

        {/* Viewport Info Box */}
        <div className="w-full p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-400 mb-6">
          <div className="flex items-center justify-between">
            <span>Lebar Layar Saat Ini:</span>
            <span className="text-pink-400 font-bold">{windowWidth}px</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Kebutuhan Minimal:</span>
            <span className="text-emerald-400 font-bold">≥ {minWidth}px</span>
          </div>
        </div>

        {/* Action Suggestion */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          <MoveHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Jika Anda di Laptop, perbesar jendela browser Anda (Fullscreen).</span>
        </div>
      </div>

      {/* Subtle Footer Brand */}
      <div className="mt-6 text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
        <span>PTIK BEMP Photobooth</span>
        <span>•</span>
        <span>Pameran Interaktif</span>
      </div>
    </div>
  );
};
