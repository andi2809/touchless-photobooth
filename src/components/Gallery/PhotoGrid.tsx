'use client';

import React, { useState } from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { Download, Trash2, X, Sparkles, Heart, Eye } from 'lucide-react';

interface PhotoGridProps {
  photos: CapturedPhoto[];
  onDeletePhoto?: (id: string) => void;
  onRequestDeletePhoto?: (photo: CapturedPhoto) => void;
}

// Alternating natural scrapbook tilt rotations
const TILT_STYLES = [
  'hover:rotate-0 -rotate-2 hover:scale-105',
  'hover:rotate-0 rotate-1.5 hover:scale-105',
  'hover:rotate-0 -rotate-1 hover:scale-105',
  'hover:rotate-0 rotate-2 hover:scale-105',
  'hover:rotate-0 -rotate-2.5 hover:scale-105',
  'hover:rotate-0 rotate-1 hover:scale-105',
];

// Sticker accents for top corner of photo strips
const STICKER_ACCENTS = [
  '/assets/decorations/heart_pink_small.png',
  '/assets/decorations/sparkle_star_yellow_small.png',
  '/assets/decorations/flower_pink.png',
  '/assets/decorations/star_blue.png',
  '/assets/decorations/sparkle_star_purple.png',
];

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onDeletePhoto,
  onRequestDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  const handleDownload = (photo: CapturedPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `PTIK-PHOTOBOOTH-${photo.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (photo: CapturedPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onRequestDeletePhoto) {
      onRequestDeletePhoto(photo);
    } else if (onDeletePhoto) {
      onDeletePhoto(photo.id);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="w-full py-12 sm:py-16 flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/camera_retro.png"
            alt="Camera"
            className="w-16 h-16 object-contain animate-floatSlow drop-shadow-md"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/sparkle_star_yellow_large.png"
            alt="Sparkle"
            className="w-6 h-6 object-contain absolute -top-2 -right-2 animate-sparkle"
          />
        </div>
        <h4 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
          Photobooth Wall Masih Kosong! ✨
        </h4>
        <p className="text-xs text-slate-600 max-w-sm mt-1 font-medium leading-relaxed">
          Yuk berfoto di Monitor 1 dengan gestur tanpa sentuh! Hasil strip fotomu akan langsung tertempel otomatis di sini. ♡
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 pt-5 p-2 pb-6">
        {photos.map((photo, index) => {
          const tiltClass = TILT_STYLES[index % TILT_STYLES.length];
          const stickerSrc = STICKER_ACCENTS[index % STICKER_ACCENTS.length];

          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className={`group relative bg-white text-slate-900 p-2 sm:p-2.5 pb-3 rounded-2xl sm:rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] border-2 border-slate-800/90 transition-all duration-300 transform ${tiltClass} cursor-pointer flex flex-col items-center hover:z-20 hover:shadow-[0_16px_32px_rgba(0,0,0,0.18)]`}
            >
              {/* Top Fresh Badge on newest photo */}
              {index === 0 ? (
                <div className="absolute -top-3 -right-2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md border border-slate-900 animate-bounce">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Terbaru!</span>
                </div>
              ) : (
                /* Cute Sticker Accent on older photos */
                <div className="absolute -top-2.5 -right-2 z-10 w-5 h-5 pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stickerSrc}
                    alt="Sticker"
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>
              )}

              {/* Tape Accent on top center */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-amber-200/90 border-t border-b border-amber-300/80 -rotate-2 rounded-[2px] shadow-sm pointer-events-none z-10 opacity-80" />

              {/* Photobooth Strip (Portrait 941:1672 Aspect Ratio) */}
              <div className="w-full aspect-[941/1672] bg-slate-50 rounded-xl sm:rounded-2xl overflow-hidden relative border border-slate-200/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageDataUrl}
                  alt={`Photo ${photo.id}`}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-102"
                />

                {/* Hover Quick Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <span className="text-[9px] font-mono text-amber-300 font-bold truncate max-w-[80px]">
                    {photo.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Individual Download */}
                    <button
                      onClick={(e) => handleDownload(photo, e)}
                      title="Unduh Strip Foto HD"
                      className="p-1.5 rounded-lg bg-pink-400 hover:bg-pink-300 text-slate-950 transition shadow font-bold hover:scale-105 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {/* Individual Single Delete */}
                    {(onRequestDeletePhoto || onDeletePhoto) && (
                      <button
                        onClick={(e) => handleDeleteClick(photo, e)}
                        title="Hapus Foto Ini (Single Delete)"
                        className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition shadow hover:scale-105 active:scale-95 border border-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Strip Bottom Footer (Time & Heart) */}
              <div className="mt-1.5 w-full px-1 flex items-center justify-between text-slate-700">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 truncate">
                  {photo.formattedTime}
                </span>
                <Heart className="w-3 h-3 fill-pink-400 text-pink-500 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlarged Scrapbook Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full bg-[#FAF6F0] text-slate-900 border-3 border-slate-900 rounded-[32px] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)] flex flex-col items-center animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Washi Tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 z-20 rotate-1 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decorations/washi_tape_green.png"
                alt="Tape"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition z-20 shadow-sm"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Strip Image Frame */}
            <div className="w-52 sm:w-60 aspect-[941/1672] bg-white rounded-2xl overflow-hidden mt-2 mb-3 border-2 border-slate-800 shadow-md flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.imageDataUrl}
                alt={`Enlarged ${selectedPhoto.id}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Info & Actions */}
            <div className="w-full flex items-center justify-between px-1 pt-2 border-t border-slate-300/80 gap-2">
              <div className="overflow-hidden">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 font-mono truncate">
                  {selectedPhoto.id}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedPhoto.formattedTime} WIB
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Individual Delete inside Lightbox */}
                {(onRequestDeletePhoto || onDeletePhoto) && (
                  <button
                    onClick={() => {
                      const photoToDelete = selectedPhoto;
                      setSelectedPhoto(null);
                      handleDeleteClick(photoToDelete);
                    }}
                    title="Hapus foto ini"
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 border-2 border-slate-900 transition shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Download in Lightbox */}
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-400 hover:bg-pink-500 text-slate-950 font-black text-xs border-2 border-slate-900 shadow transition transform hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh HD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
