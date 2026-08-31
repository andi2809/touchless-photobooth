'use client';

import React, { useEffect } from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: 'SINGLE' | 'BATCH';
  targetPhoto?: CapturedPhoto | null;
  totalPhotosCount?: number;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  targetPhoto,
  totalPhotosCount = 0,
}) => {
  // ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSingle = mode === 'SINGLE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-[#FAF6F0] text-slate-900 border-3 border-slate-900 rounded-[32px] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)] flex flex-col items-center animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Washi Tape Decoration */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 z-20 -rotate-1 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/washi_tape_green.png"
            alt="Tape"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition shadow-sm"
          title="Batal / Tutup (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon / Badge */}
        <div className="mt-2 mb-3 flex items-center justify-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-md ${
            isSingle ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600 animate-pulse'
          }`}>
            {isSingle ? (
              <Trash2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
        </div>

        {/* Modal Title */}
        <h3
          id="delete-modal-title"
          className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight"
        >
          {isSingle ? 'Hapus Foto Strip Ini?' : 'Hapus Seluruh Galeri Foto?'}
        </h3>

        {/* Modal Body / Details */}
        {isSingle && targetPhoto ? (
          <div className="w-full my-3.5 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center gap-3.5">
            {/* Thumbnail Preview */}
            <div className="w-14 h-24 aspect-[941/1672] rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetPhoto.imageDataUrl}
                alt={targetPhoto.id}
                className="w-full h-full object-contain"
              />
            </div>
            {/* Metadata Info */}
            <div className="flex-1 overflow-hidden text-left">
              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-[10px] font-mono font-bold text-amber-900 truncate max-w-full">
                {targetPhoto.id}
              </span>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Waktu: <span className="text-slate-900 font-bold">{targetPhoto.formattedTime} WIB</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                Foto ini akan dihapus dari tampilan galeri monitor.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full my-3.5 p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 text-left">
            <div className="flex items-center gap-2 text-xs font-black text-red-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Tindakan Massal (Batch Delete)</span>
            </div>
            <p className="text-xs text-red-800 font-medium leading-relaxed">
              Kamu akan menghapus seluruh <strong className="font-black text-red-950 underline">{totalPhotosCount} foto strip</strong> dari galeri pameran. Tindakan ini permanen dan tidak dapat dibatalkan.
            </p>
          </div>
        )}

        {/* Subtitle / Note */}
        <p className="text-xs text-slate-500 text-center font-medium px-2 mb-4">
          {isSingle
            ? 'Apakah kamu yakin ingin melanjutkan penghapusan foto ini?'
            : 'Pastikan pengunjung sudah menyimpan foto mereka sebelum mengosongkan galeri.'}
        </p>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-black text-xs sm:text-sm border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-xs sm:text-sm border-2 border-slate-900 shadow-[0_3px_0_#0f172a] transition active:translate-y-0.5 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isSingle ? 'Ya, Hapus' : 'Ya, Hapus Semua'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
