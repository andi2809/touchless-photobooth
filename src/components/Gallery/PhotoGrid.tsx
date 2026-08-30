'use client';

import React, { useState } from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { Download, Maximize2, Trash2, X, Sparkles, Image as ImageIcon, Heart } from 'lucide-react';

interface PhotoGridProps {
  photos: CapturedPhoto[];
  onDeletePhoto?: (id: string) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onDeletePhoto }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  const handleDownload = (photo: CapturedPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `PTI-BEMP-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Alternating playful tilt angles for polaroid gallery effect
  const getTiltClass = (index: number) => {
    const tilts = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-0'];
    return tilts[index % tilts.length];
  };

  if (photos.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center text-center px-4">
        <div className="p-6 rounded-3xl bg-white/10 border-2 border-white/20 backdrop-blur-xl mb-4 shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-float-slow">
          <ImageIcon className="w-14 h-14 text-white/80 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
          Galeri Pameran Menunggu Foto Pertama! 🎉
        </h3>
        <p className="text-sm text-white/80 max-w-md mt-2 font-medium">
          Berfotolah di Photobooth Monitor 1 dengan gestur kotak 2 tangan untuk melihat fotomu terpampang di sini!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {photos.map((photo, index) => {
          const tiltClass = getTiltClass(index);

          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className={`group relative bg-white/90 dark:bg-slate-900/90 p-3 pb-4 rounded-2xl shadow-xl hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] border-2 border-white/40 backdrop-blur-md transition-all duration-300 transform ${tiltClass} hover:rotate-0 hover:scale-105 cursor-pointer`}
            >
              {/* Top Fresh Badge */}
              {index === 0 && (
                <div className="absolute -top-3 -right-2 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-neon-pink to-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-neon-pink animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Baru!</span>
                </div>
              )}

              {/* Polaroid Snapshot Frame */}
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner border border-slate-700/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageDataUrl}
                  alt={`Photo ${photo.id}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                  <span className="text-[11px] font-mono text-neon-cyan font-bold">
                    {photo.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownload(photo, e)}
                      title="Unduh Foto"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-neon-cyan hover:text-black text-white transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {onDeletePhoto && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePhoto(photo.id);
                        }}
                        title="Hapus Foto"
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-red-500 text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Polaroid Handwritten Style Caption */}
              <div className="mt-3 px-1 flex items-center justify-between text-slate-800 dark:text-slate-200">
                <div>
                  <p className="text-xs font-bold font-mono tracking-wider text-slate-900 dark:text-white">
                    {photo.id}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {photo.formattedTime}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-pink-500">
                  <Heart className="w-4 h-4 fill-pink-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 border-2 border-neon-cyan rounded-3xl p-5 shadow-neon-cyan flex flex-col items-center animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden mb-4 border border-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.imageDataUrl}
                alt={`Enlarged ${selectedPhoto.id}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full flex items-center justify-between px-2 text-slate-300">
              <div>
                <h4 className="text-lg font-bold text-white tracking-wide">ID: {selectedPhoto.id}</h4>
                <p className="text-xs text-slate-400">{selectedPhoto.formattedTime}</p>
              </div>
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-neon-cyan transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Asli HD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
