import React from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { BoothState } from '@/types/boothState';

interface PhotoProgressBarProps {
  photos: CapturedPhoto[];
  currentPhotoIndex: number;
  state: BoothState;
}

export const PhotoProgressBar: React.FC<PhotoProgressBarProps> = ({
  photos,
  currentPhotoIndex,
  state,
}) => {
  if (state === 'IDLE') return null;

  return (
    <footer className="absolute bottom-5 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none select-none">
      <div className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/95 text-slate-900 border-2 border-amber-300 shadow-[0_8px_0_#f59e0b] backdrop-blur-md">
        <span className="text-xs font-black uppercase tracking-wider text-slate-800 mr-1 hidden sm:inline">
          Progres Sesi:
        </span>

        {[0, 1, 2].map((idx) => {
          const photo = photos[idx];
          const isCurrent =
            (state === 'READY' || state === 'COUNTDOWN' || state === 'CAPTURE') &&
            currentPhotoIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 transition-all ${
                photo
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                  : isCurrent
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-black scale-105 shadow-sm'
                  : 'bg-slate-100 border-slate-300 text-slate-400'
              }`}
            >
              {/* Badge Icon */}
              <div className="w-4 h-4 relative shrink-0">
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/assets/icons/check_selected.png"
                    alt="Selesai"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/assets/icons/badge_number_${idx + 1}.png`}
                    alt={`Foto ${idx + 1}`}
                    className={`w-full h-full object-contain ${
                      !isCurrent ? 'grayscale opacity-60' : ''
                    }`}
                  />
                )}
              </div>

              <span className="text-[11px] font-mono whitespace-nowrap">
                Foto {idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
