'use client';

import React, { useEffect, useState } from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { Download, Check, Share2, Sparkles, X, Cloud, RefreshCw } from 'lucide-react';

interface PhotoPreviewModalProps {
  photo: CapturedPhoto | null;
  onClose: () => void;
  googleScriptUrl?: string;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  onClose,
  googleScriptUrl,
}) => {
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [autoCloseTimer, setAutoCloseTimer] = useState<number>(7);

  // Auto upload to Google Apps Script if URL provided
  useEffect(() => {
    if (!photo) return;
    setDownloaded(false);
    setAutoCloseTimer(7);

    const scriptUrl = googleScriptUrl || (typeof window !== 'undefined' ? localStorage.getItem('pti_gas_webhook_url') : '');

    if (scriptUrl && scriptUrl.startsWith('http')) {
      setUploadStatus('uploading');
      fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // standard GAS webapp CORS bypass
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photo.imageDataUrl,
          filename: `photo-${photo.id}-${Date.now()}.jpg`,
        }),
      })
        .then(() => {
          setUploadStatus('success');
        })
        .catch((err) => {
          console.warn('[PhotoPreviewModal] Google Apps Script upload failed:', err);
          setUploadStatus('error');
        });
    }
  }, [photo, googleScriptUrl]);

  // Auto close countdown
  useEffect(() => {
    if (!photo) return;

    const interval = setInterval(() => {
      setAutoCloseTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [photo, onClose]);

  if (!photo) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `PTI-BEMP-${photo.id}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative flex flex-col items-center max-w-2xl w-full bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-neon-cyan text-white">
        {/* Top Close / Timer bar */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <span className="font-bold text-sm tracking-wide">
              Foto Berhasil Diabadikan! ({photo.id})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Polaroid Style Image Preview */}
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black aspect-video flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageDataUrl}
            alt="Captured Photobooth Snapshot"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Sync Status Badges */}
        <div className="w-full flex items-center justify-between text-xs text-slate-300 mt-4 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Share2 className="w-3.5 h-3.5" />
            <span>Tersinkron ke Monitor 2</span>
          </div>

          {uploadStatus === 'uploading' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Mengunggah ke Google Drive...</span>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Cloud className="w-3.5 h-3.5" />
              <span>Tersimpan di Google Drive</span>
            </div>
          )}

          <div className="text-slate-400 font-mono text-[11px]">
            Kembali dalam {autoCloseTimer}s
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition"
          >
            Foto Lagi 📸
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-neon-cyan transition"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Tersimpan di Mac' : 'Unduh Foto (HD)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
