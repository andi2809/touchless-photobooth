import React from 'react';
import { FrameTemplate } from '@/config/frameTemplates';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface FrameSelectionViewProps {
  allTemplates: FrameTemplate[];
  currentIndex: number;
  onSelectPrev: () => void;
  onSelectNext: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FrameSelectionView: React.FC<FrameSelectionViewProps> = ({
  allTemplates,
  currentIndex,
  onSelectPrev,
  onSelectNext,
  onConfirm,
  onCancel,
}) => {
  const currentTemplate = allTemplates[currentIndex] || allTemplates[0];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3 sm:p-4 pt-12 pb-8 select-none pointer-events-none">
      {/* Decorative Stickers in corners */}
      <div className="absolute top-6 left-6 pointer-events-none hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/sparkle_star_yellow_large.png"
          alt="Star"
          className="w-10 h-10 object-contain animate-pulse"
        />
      </div>
      <div className="absolute top-6 right-6 pointer-events-none hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/heart_pink.png"
          alt="Heart"
          className="w-10 h-10 object-contain"
        />
      </div>

      {/* Main Center Frame Showcase with Motion-Based Swipe Controls */}
      <div className="pointer-events-auto flex items-center justify-center gap-4 sm:gap-8 lg:gap-14 my-auto w-full max-w-5xl">
        {/* Left Motion Swipe Indicator & Button */}
        <div
          onClick={onSelectPrev}
          className="flex flex-col items-center group cursor-pointer transition-all hover:scale-105"
        >
          {/* Motion Card */}
          <div className="relative p-3 sm:p-4 rounded-3xl bg-white/95 text-slate-900 border-3 border-pink-300 shadow-lg flex flex-col items-center text-center max-w-[150px] sm:max-w-[170px]">
            {/* Animated Motion Hand moving Left */}
            <div className="relative flex items-center justify-center w-16 h-12 mb-1">
              <ChevronsLeft className="w-6 h-6 text-pink-500 animate-pulse" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/gesture_open_palm.png"
                alt="Move Left"
                className="w-10 h-10 object-contain transform -translate-x-1 group-hover:-translate-x-3 transition-transform duration-300"
              />
            </div>

            <span className="text-[11px] sm:text-xs font-black uppercase text-pink-600 tracking-wide block leading-tight">
              GESER KE KIRI
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block mt-0.5">
              ⟵ Frame Sebelumnya
            </span>
          </div>
        </div>

        {/* Center Hero: Portrait Frame Template (941:1672 Aspect Ratio) */}
        <div className="relative flex flex-col items-center">
          {/* Washi Tape on Frame Top */}
          <div className="absolute -top-3.5 z-30 w-28 h-6 rotate-[-1deg]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/decorations/washi_tape_green.png"
              alt="Tape"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Frame Container */}
          <div className="relative w-56 sm:w-64 md:w-72 lg:w-[310px] aspect-[941/1672] max-h-[58vh] rounded-3xl overflow-hidden border-4 border-slate-800 bg-white/10 shadow-2xl backdrop-blur-[2px] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTemplate.assetPath}
              alt={currentTemplate.name}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {allTemplates.map((_, idx) => (
              <div
                key={idx}
                className={`transition-all ${
                  idx === currentIndex
                    ? 'w-4 h-2.5 bg-pink-500 rounded-full shadow-sm'
                    : 'w-2 h-2 bg-white/80 rounded-full'
                }`}
              />
            ))}
          </div>

          {/* Frame Name Tag */}
          <div className="mt-1.5 px-4 py-1 rounded-full bg-white/95 border-2 border-slate-800 text-xs font-black text-slate-800 shadow-md flex items-center gap-1.5">
            <span className="text-pink-500">♡</span>
            <span>{currentTemplate.name}</span>
            <span className="text-slate-400 font-mono text-[10px]">({currentIndex + 1}/{allTemplates.length})</span>
          </div>
        </div>

        {/* Right Motion Swipe Indicator & Button */}
        <div
          onClick={onSelectNext}
          className="flex flex-col items-center group cursor-pointer transition-all hover:scale-105"
        >
          {/* Motion Card */}
          <div className="relative p-3 sm:p-4 rounded-3xl bg-white/95 text-slate-900 border-3 border-blue-300 shadow-lg flex flex-col items-center text-center max-w-[150px] sm:max-w-[170px]">
            {/* Animated Motion Hand moving Right */}
            <div className="relative flex items-center justify-center w-16 h-12 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/gesture_open_palm.png"
                alt="Move Right"
                className="w-10 h-10 object-contain transform translate-x-1 group-hover:translate-x-3 transition-transform duration-300"
              />
              <ChevronsRight className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>

            <span className="text-[11px] sm:text-xs font-black uppercase text-blue-600 tracking-wide block leading-tight">
              GESER KE KANAN
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block mt-0.5">
              Frame Berikutnya ⟶
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Prompt: Physical Sticker Pill */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* OK Sign Confirm Sticker */}
        <div
          onClick={onConfirm}
          className="flex items-center gap-3 px-7 py-2.5 rounded-full bg-amber-300 hover:bg-amber-400 text-slate-950 border-3 border-slate-800 shadow-md cursor-pointer transition transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gestures/hand_pointing_up.png"
            alt="Confirm"
            className="w-7 h-7 object-contain transform rotate-45 animate-bounce"
          />
          <div className="text-left">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wide block leading-none">
              GESTUR OK 👌
            </span>
            <span className="text-[10px] font-bold text-slate-800 block">
              UNTUK MEMILIH FRAME INI
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-full bg-white/95 hover:bg-slate-100 text-slate-800 text-xs font-bold border-2 border-slate-800 shadow-sm transition flex items-center gap-1.5"
        >
          <span>👎</span>
          <span>Jempol Bawah (Batal)</span>
        </button>
      </div>
    </div>
  );
};
