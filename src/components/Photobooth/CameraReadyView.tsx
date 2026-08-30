import React from 'react';

interface CameraReadyViewProps {
  currentPhotoIndex: number;
  templateName: string;
  onTriggerPeace: () => void;
  onCancel: () => void;
}

export const CameraReadyView: React.FC<CameraReadyViewProps> = ({
  currentPhotoIndex,
  templateName,
  onTriggerPeace,
  onCancel,
}) => {
  const photoNumber = currentPhotoIndex + 1;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 pt-14 pb-14 select-none pointer-events-none">
      {/* Top Banner: Selected Frame Name with Pink Tape */}
      <div className="relative pointer-events-auto">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-pink-400/80 -rotate-1 rounded-sm shadow-sm" />
        <div className="px-6 py-1.5 rounded-full bg-pink-200/95 text-pink-950 font-black text-xs sm:text-sm border-2 border-pink-300 shadow-sm flex items-center gap-2">
          <span>♡</span>
          <span className="uppercase tracking-wide">{templateName}</span>
          <span>♡</span>
        </div>
      </div>

      {/* Center Prompt */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="text-center">
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 block mb-1">
            - LOOK AT CAMERA -
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-amber-500 drop-shadow-sm font-sans tracking-tight">
            GET READY! ⭐️
          </h2>
        </div>

        {/* Center Camera Sticker with Heart */}
        <div className="relative my-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/camera_retro.png"
            alt="Camera"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-lg animate-pulse"
          />
          <div className="absolute -right-3 -top-2 w-7 h-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/decorations/heart_pink.png"
              alt="Heart"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Action Prompt Pill: Show Peace */}
        <div
          onClick={onTriggerPeace}
          className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-pink-400 hover:bg-pink-500 text-slate-950 border-2 border-slate-800 shadow-md cursor-pointer transition transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gestures/hand_peace_sign.png"
            alt="Peace"
            className="w-7 h-7 object-contain animate-bounce"
          />
          <div className="text-left">
            <span className="text-xs font-black uppercase tracking-wider block leading-none">
              SHOW PEACE ✌️
            </span>
            <span className="text-[10px] font-bold text-slate-900 block">
              TO TAKE PHOTO {photoNumber} OF 3
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Back Action */}
      <div className="pointer-events-auto">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-full bg-white/95 hover:bg-slate-100 text-slate-800 text-xs font-bold border-2 border-slate-800 shadow-sm flex items-center gap-1.5"
        >
          <span>👎</span>
          <span>Jempol Bawah (Ganti Frame)</span>
        </button>
      </div>
    </div>
  );
};
