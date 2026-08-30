import React from 'react';

interface IdleViewProps {
  onStart: () => void;
  onOpenGuide: () => void;
}

export const IdleView: React.FC<IdleViewProps> = ({ onStart, onOpenGuide }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
      {/* Center Sticker Title Card */}
      <div className="flex flex-col items-center animate-fade-in pointer-events-auto">
        {/* Crown sticker on P */}
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-10 h-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/decorations/sparkle_star_yellow_small.png"
              alt="Crown"
              className="w-full h-full object-contain"
            />
          </div>

          {/* PTIK PHOTOBOOTH Main Title Logo */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/branding/text_ptik_colorful.png"
              alt="PTIK"
              className="h-16 sm:h-20 object-contain filter drop-shadow-md"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 font-sans">
              PHOTOBOOTH
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/decorations/heart_pink_small.png"
              alt="Heart"
              className="w-6 h-6 object-contain inline-block"
            />
          </div>
        </div>

        {/* Blue Ribbon: READY TO PLAY? */}
        <div className="mt-3 px-6 py-1 rounded-full bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md border-2 border-blue-400">
          READY TO PLAY?
        </div>

        {/* Action Cards: Open Guide OR Start Booth */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Guide Card */}
          <div
            onClick={onOpenGuide}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/95 text-slate-900 border-2 border-slate-300 shadow-md backdrop-blur-md cursor-pointer transform hover:scale-105 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/gestures/hand_pointing_up.png"
              alt="Guide"
              className="w-9 h-9 object-contain"
            />
            <div className="text-left">
              <span className="text-[11px] font-bold text-slate-500 block leading-tight">
                Panduan Gestur
              </span>
              <span className="px-2 py-0.5 mt-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase inline-block">
                OPEN GUIDE
              </span>
            </div>
          </div>

          <span className="text-slate-400 font-mono text-xs font-bold">or</span>

          {/* Start Booth Card */}
          <div
            onClick={onStart}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/95 text-slate-900 border-2 border-pink-300 shadow-md backdrop-blur-md cursor-pointer transform hover:scale-105 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/gestures/hand_peace_sign.png"
              alt="Start"
              className="w-9 h-9 object-contain animate-bounce"
            />
            <div className="text-left">
              <span className="text-xs font-black text-slate-800 block leading-tight">
                Tunjukkan ✌️ Peace
              </span>
              <span className="px-2.5 py-0.5 mt-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase inline-block shadow-sm">
                START BOOTH
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Pill: No touch, just your hand! */}
        <div className="mt-5 px-4 py-1.5 rounded-full bg-white/90 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5">
          <span className="text-amber-500">✨</span>
          <span>No touch, just your hand!</span>
          <span className="text-pink-500">♡</span>
        </div>
      </div>
    </div>
  );
};
