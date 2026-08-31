'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CapturedPhoto } from '@/types/photobooth';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  Sparkles,
  X,
  Download,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Copy,
  Check,
} from 'lucide-react';

interface NewPhotoShowcaseModalProps {
  photo: CapturedPhoto | null;
  onDismiss: () => void;
  autoDismissSeconds?: number;
  downloadUrl?: string;
  onPlaySuccessSound?: () => void;
}

export const NewPhotoShowcaseModal: React.FC<NewPhotoShowcaseModalProps> = ({
  photo,
  onDismiss,
  autoDismissSeconds = 60,
  downloadUrl = 'https://s.id/ptik-photobooth',
  onPlaySuccessSound,
}) => {
  // Phase: 'UPLOADING_SIMULATION' -> 'SHOWCASE'
  const [phase, setPhase] = useState<'UPLOADING_SIMULATION' | 'SHOWCASE'>('UPLOADING_SIMULATION');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('Menghubungkan ke server cloud...');
  const [timeLeft, setTimeLeft] = useState<number>(autoDismissSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const onPlaySuccessSoundRef = useRef(onPlaySuccessSound);
  useEffect(() => {
    onPlaySuccessSoundRef.current = onPlaySuccessSound;
  }, [onPlaySuccessSound]);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      // Big center burst
      confetti({
        particleCount: 90,
        spread: 100,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#f472b6', '#fbbf24', '#38bdf8', '#a855f7', '#10b981', '#ffffff'],
        startVelocity: 45,
      });

      // Flank sparkles
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 65,
          origin: { x: 0.2, y: 0.65 },
          colors: ['#ec4899', '#fde047', '#60a5fa'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 65,
          origin: { x: 0.8, y: 0.65 },
          colors: ['#ec4899', '#fde047', '#60a5fa'],
        });
      }, 300);
    } catch (e) {
      console.warn('[Celebration] Confetti error:', e);
    }
  }, []);

  const currentPhotoId = photo?.id;

  // Pure Dummy Upload Simulation: starts whenever a new photo arrives
  useEffect(() => {
    if (!currentPhotoId) {
      setPhase('UPLOADING_SIMULATION');
      setUploadProgress(0);
      return;
    }

    // Reset states for new photo
    setPhase('UPLOADING_SIMULATION');
    setUploadProgress(10);
    setUploadStatusText('Menghubungkan ke server cloud... ☁️');
    setTimeLeft(autoDismissSeconds);
    setIsPaused(false);

    const startTime = Date.now();
    const DURATION_MS = 2200; // 2.2 seconds simulated dummy upload

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));

      setUploadProgress(pct);

      if (pct < 35) {
        setUploadStatusText('Menghubungkan ke server cloud... ☁️');
      } else if (pct < 75) {
        setUploadStatusText('Mengunggah file strip resolusi tinggi... 📸');
      } else if (pct < 98) {
        setUploadStatusText('Menghasilkan QR Code & link unduhan... 📱');
      } else {
        setUploadStatusText('Selesai! Menyiapkan tampilan... ✨');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('SHOWCASE');
          if (onPlaySuccessSoundRef.current) {
            try {
              onPlaySuccessSoundRef.current();
            } catch (e) {}
          }
          triggerConfetti();
        }, 250);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentPhotoId, autoDismissSeconds, triggerConfetti]);

  // 10-Second Countdown timer in SHOWCASE phase
  useEffect(() => {
    if (!photo || phase !== 'SHOWCASE' || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismissRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [photo, phase, isPaused]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!photo) return;
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `PTIK-PHOTOBOOTH-${photo.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="showcase-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FAF6F0] text-slate-900 border-3 border-slate-900 rounded-[32px] sm:rounded-[40px] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.35)] flex flex-col items-center animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Washi Tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-36 h-7 z-30 -rotate-1 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/washi_tape_green.png"
            alt="Tape"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Decorative corner stickers */}
        <div className="absolute -top-2 -right-2 z-20 w-10 h-10 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/sparkle_star_yellow_large.png"
            alt="Star"
            className="w-full h-full object-contain animate-sparkle"
          />
        </div>
        <div className="absolute -bottom-2 -left-2 z-20 w-9 h-9 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/flower_pink.png"
            alt="Flower"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-700 transition shadow-sm z-30"
          title="Tutup & Kembali ke Galeri (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================= */}
        {/* PHASE 1: DUMMY UPLOAD LOADING STATE SIMULATION            */}
        {/* ========================================================= */}
        {phase === 'UPLOADING_SIMULATION' ? (
          <div className="w-full py-8 sm:py-12 flex flex-col items-center justify-center text-center px-4 max-w-lg">
            {/* Pulsing Cloud / Upload Animation */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 p-1 animate-spin-slow">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-slate-900">
                  <UploadCloud className="w-10 h-10 text-pink-500 animate-bounce" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-900" />
              </div>
            </div>

            {/* Title */}
            <div className="px-4 py-1 rounded-full bg-amber-200 border-2 border-slate-900 text-slate-950 font-black text-xs uppercase tracking-wider mb-2 shadow-sm">
              <span>SEDANG MENGUNGGAH FOTO KE SERVER...</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 tracking-tight">
              Menyiapkan Hasil Photobooth Kamu! ✨
            </h3>
            <p className="text-xs text-slate-600 font-bold mb-6">
              {uploadStatusText}
            </p>

            {/* Skeleton & Progress Bar */}
            <div className="w-full max-w-sm flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono font-black text-slate-800 px-1">
                <span>Status Unggah</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden border-2 border-slate-900 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400 rounded-full transition-all duration-75"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Cute Skeleton Preview Placeholders */}
            <div className="flex items-center gap-3 mt-6 opacity-60">
              <div className="w-12 h-20 rounded-lg bg-slate-200 border border-slate-300 animate-pulse" />
              <div className="w-12 h-20 rounded-lg bg-slate-300 border border-slate-400 animate-pulse" />
              <div className="w-12 h-20 rounded-lg bg-slate-200 border border-slate-300 animate-pulse" />
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* PHASE 2: SIDE-BY-SIDE NEW PHOTO & BIG QR CODE PRESENTATION */
          /* ========================================================= */
          <div className="w-full flex flex-col items-center">
            {/* Top Announcement Banner */}
            <div className="flex items-center gap-2 mb-4">
              <div className="px-5 sm:px-7 py-1.5 rounded-full bg-pink-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-slate-900 shadow-[0_3px_0_#0f172a] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-700 animate-bounce" />
                <span>🎉 FOTO BARU SELESAI & SIAP DI-SCAN! 🎉</span>
                <Sparkles className="w-4 h-4 text-pink-700 animate-bounce" />
              </div>
            </div>

            {/* Main Side-by-Side Grid Container */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-center justify-center my-1">
              {/* LEFT: Finished Photo Strip */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative group p-2.5 sm:p-3 bg-white rounded-3xl border-3 border-slate-900 shadow-[0_12px_28px_rgba(0,0,0,0.12),0_4px_0_#0f172a] max-w-[260px] sm:max-w-[280px] w-full flex flex-col items-center transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Top tape on the mini frame */}
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200 border-t border-b border-amber-300 -rotate-2 rounded-[2px] pointer-events-none" />

                  {/* Strip Container 941:1672 */}
                  <div className="w-full aspect-[941/1672] max-h-[48vh] rounded-2xl overflow-hidden border-2 border-slate-900 bg-slate-50 flex items-center justify-center shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageDataUrl}
                      alt="Hasil Foto Baru"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Photo details */}
                  <div className="mt-2 text-center w-full">
                    <span className="font-mono text-xs font-black text-slate-900 block truncate">
                      {photo.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {photo.formattedTime} WIB
                    </span>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-pink-400 hover:bg-pink-500 text-slate-950 font-black text-xs border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Foto HD</span>
                  </button>
                </div>
              </div>

              {/* RIGHT: Prominent Big QR Code & 10s Countdown Timer */}
              <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                
                {/* Big QR Card */}
                <div className="w-full p-4 sm:p-5 rounded-3xl bg-[#FFF9E6] border-3 border-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.06),0_4px_0_#0f172a] flex flex-col sm:flex-row items-center gap-4">
                  {/* Large QR Code Component */}
                  <div className="shrink-0">
                    <QRCodeDisplay
                      url={downloadUrl}
                      size={180}
                      showDoodleFrame={false}
                      borderClassName="border-3 border-slate-900 shadow-md"
                    />
                  </div>

                  {/* QR Guidance & Link */}
                  <div className="flex-1 flex flex-col items-center sm:items-start space-y-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-300 border-2 border-slate-900 text-slate-950 font-black text-xs uppercase">
                      <span>📱 SCAN LANGSUNG DI SINI</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      Buka kamera smartphone untuk mengunduh foto strip ini! ♡
                    </h4>

                    {/* Shortlink Box */}
                    <div className="w-full flex items-center gap-1.5 bg-white p-1.5 pr-2 rounded-2xl border-2 border-slate-900 shadow-sm">
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 font-mono text-xs font-black text-blue-600 hover:underline px-2 truncate"
                      >
                        {downloadUrl.replace('https://', '')}
                      </a>
                      <button
                        onClick={handleCopyLink}
                        title="Salin Link"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-300"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 transition border border-blue-300"
                        title="Buka Link di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      Foto otomatis tersimpan di Google Drive Cloud BEMP PTIK UNJ.
                    </p>
                  </div>
                </div>

                {/* 1-Minute (60s) Timer & Action Strip */}
                <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-white border-2 border-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Timer Visual */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative min-w-[48px] px-2 h-9 rounded-full bg-purple-100 border-2 border-slate-900 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-purple-950 shadow-inner">
                      <span>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Layar Otomatis Berpindah</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {isPaused
                          ? 'Timer dijeda (Mode Santai)'
                          : timeLeft >= 60
                          ? `Menutup otomatis dalam 1 menit (${timeLeft} detik)`
                          : `Menutup otomatis dalam ${timeLeft} detik`}
                      </p>
                    </div>
                  </div>

                  {/* Timer Controls & Close Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-slate-900 transition flex items-center gap-1 shadow-sm ${
                        isPaused
                          ? 'bg-emerald-300 hover:bg-emerald-400 text-emerald-950'
                          : 'bg-amber-200 hover:bg-amber-300 text-amber-950'
                      }`}
                      title={isPaused ? 'Lanjutkan Timer' : 'Jeda Timer agar tidak menutup'}
                    >
                      {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      <span>{isPaused ? 'Lanjutkan' : 'Tahan Layar'}</span>
                    </button>

                    <button
                      onClick={onDismiss}
                      className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs border-2 border-slate-900 shadow-sm transition active:translate-y-0.5 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ke Galeri Utama</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
