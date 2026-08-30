import React from 'react';

interface CountdownViewProps {
  countdown: number | null;
  currentPhotoIndex: number;
}

export const CountdownView: React.FC<CountdownViewProps> = ({
  countdown,
  currentPhotoIndex,
}) => {
  if (countdown === null) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
      {/* Top Banner: GET READY! */}
      <div className="relative mb-2">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-pink-400/80 -rotate-1 rounded-sm shadow-sm" />
        <div className="px-6 py-1 rounded-full bg-pink-200/95 text-pink-950 font-black text-xs uppercase tracking-wider border border-pink-300 shadow-sm">
          GET READY!
        </div>
      </div>

      {/* Title: SMILE BIG! */}
      <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">
        - SMILE BIG! -
      </div>

      {/* Subtitle Banner: Photo will be taken in */}
      <div className="px-4 py-1 rounded-full bg-white/90 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm mb-4">
        Photo will be taken in
      </div>

      {/* Large Circular Countdown Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-pink-300 bg-white/90 shadow-2xl flex items-center justify-center backdrop-blur-sm">
          <span className="text-7xl sm:text-8xl font-black text-pink-500 font-sans leading-none filter drop-shadow-md animate-bounce">
            {countdown}
          </span>
        </div>

        {/* Decorative Sparkle Stars around ring */}
        <div className="absolute -top-3 -left-3 w-8 h-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/sparkle_star_yellow_small.png"
            alt="Star"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -bottom-2 -right-3 w-7 h-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/heart_pink_small.png"
            alt="Heart"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Photo Pagination Dots */}
      <div className="flex items-center gap-2 mt-6">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentPhotoIndex
                ? 'bg-pink-500 w-6 shadow-sm'
                : idx < currentPhotoIndex
                ? 'bg-emerald-400'
                : 'bg-slate-300/80'
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-slate-700 mt-1">
        Foto {currentPhotoIndex + 1} dari 3
      </span>
    </div>
  );
};
