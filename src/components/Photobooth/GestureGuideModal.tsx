import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCloseSeconds?: number;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({
  isOpen,
  onClose,
  autoCloseSeconds = 10,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(autoCloseSeconds);
  const wasOpenRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Uninterrupted 10s Countdown Timer (Starts once upon modal opening)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setSecondsLeft(autoCloseSeconds);

      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onCloseRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, autoCloseSeconds]);

  if (!isOpen) return null;

  const progressPercent = (secondsLeft / autoCloseSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative max-w-3xl w-full bg-[#FFFDF9] text-slate-900 border-3 border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header with Pink Tape */}
        <div className="relative mb-2">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-pink-400/80 -rotate-2 rounded-sm shadow-sm" />
          <div className="px-6 py-1.5 rounded-full bg-pink-200 text-pink-950 font-black text-xs uppercase tracking-wider border border-pink-300">
            GESTURE GUIDE
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <span>- CARA MENGGUNAKAN -</span>
          <span className="text-pink-500">♡</span>
        </h2>

        {/* 4 Gesture Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-5">
          {/* 1. Swipe Left / Right */}
          <div className="p-3 rounded-2xl bg-pink-50/90 border-2 border-pink-200 flex flex-col items-center text-center">
            <span className="text-xs font-black uppercase text-pink-800 mb-0.5">
              SWIPE ⟵ / ⟶
            </span>
            <span className="text-[10px] text-slate-500 font-bold mb-2">Pilih Frame</span>
            <div className="w-12 h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/gesture_open_palm.png"
                alt="Swipe"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 mt-1">Geser Tangan</span>
          </div>

          {/* 2. OK Sign & Thumbs Down */}
          <div className="p-3 rounded-2xl bg-amber-50/90 border-2 border-amber-200 flex flex-col items-center text-center">
            <span className="text-xs font-black uppercase text-amber-800 mb-0.5">
              👌 OK / 👎 BATAL
            </span>
            <span className="text-[10px] text-slate-500 font-bold mb-2">Pilih / Kembali</span>
            <div className="w-12 h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/hand_pointing_up.png"
                alt="OK / Batal"
                className="w-10 h-10 object-contain transform rotate-45"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 mt-1">👌 Pilih | 👎 Batal</span>
          </div>

          {/* 3. Peace Sign */}
          <div className="p-3 rounded-2xl bg-emerald-50/90 border-2 border-emerald-200 flex flex-col items-center text-center">
            <span className="text-xs font-black uppercase text-emerald-800 mb-0.5">
              ✌️ PEACE
            </span>
            <span className="text-[10px] text-slate-500 font-bold mb-2">Mulai / Foto</span>
            <div className="w-12 h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/hand_peace_sign.png"
                alt="Peace Sign"
                className="w-10 h-10 object-contain animate-bounce"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 mt-1">Foto 1, 2, 3</span>
          </div>

          {/* 4. L-Sign */}
          <div className="p-3 rounded-2xl bg-blue-50/90 border-2 border-blue-200 flex flex-col items-center text-center">
            <span className="text-xs font-black uppercase text-blue-800 mb-0.5">
              👆 HURUF L
            </span>
            <span className="text-[10px] text-slate-500 font-bold mb-2">Buka Panduan</span>
            <div className="w-12 h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gestures/hand_pointing_up.png"
                alt="L Sign"
                className="w-10 h-10 object-contain transform rotate-12"
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 mt-1">Kapan Saja</span>
          </div>
        </div>

        {/* Tips Sticky */}
        <div className="px-4 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-xs font-semibold text-slate-700 mb-4 text-center">
          💡 Tunjukkan gestur <strong>👌 OK</strong>, <strong>✌️ Peace</strong>, atau klik tombol di bawah untuk menutup panduan ini.
        </div>

        {/* Auto-Dismiss Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-pink-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Got It Button */}
        <button
          onClick={onClose}
          className="px-8 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center gap-2"
        >
          <span>MENGERTI! ✌️</span>
          <span className="text-[10px] text-slate-400 font-normal">({secondsLeft}s)</span>
        </button>
      </div>
    </div>
  );
};
