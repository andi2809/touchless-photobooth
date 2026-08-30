import React from 'react';
import { CapturedPhoto } from '@/types/photobooth';
import { FrameTemplate } from '@/config/frameTemplates';
import { ArrowRight, UploadCloud } from 'lucide-react';

interface CompositingViewProps {
  state: 'COMPOSITING' | 'UPLOADING';
  photos: CapturedPhoto[];
  selectedTemplate: FrameTemplate;
}

export const CompositingView: React.FC<CompositingViewProps> = ({
  state,
  photos,
  selectedTemplate,
}) => {
  const isUploading = state === 'UPLOADING';

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 pt-14 pb-14 select-none pointer-events-none bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Top Banner with Washi Tape */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="relative mb-1">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-purple-400/80 -rotate-1 rounded-sm shadow-sm" />
          <div className="px-6 py-1.5 rounded-full bg-purple-200/95 text-purple-950 font-black text-xs sm:text-sm uppercase tracking-wider border border-purple-300 shadow-sm">
            {isUploading ? '- MENGUPLOAD KE DRIVE... -' : '- MENGGABUNG FOTO... -'}
          </div>
        </div>
        <div className="px-4 py-1 rounded-full bg-white/90 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm">
          {isUploading ? 'Jangan tutup halaman ini ya! ♡' : 'Sedikit lagi jadi satu! ♡'}
        </div>
      </div>

      {/* Center Graphic */}
      <div className="flex items-center justify-center gap-6 my-auto pointer-events-auto">
        {!isUploading ? (
          /* Compositing visual: 3 photos -> Arrow -> Strip */
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Left 3 stacked photo thumbnails */}
            <div className="flex flex-col gap-2">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  className="w-20 sm:w-24 aspect-[16/10] bg-white p-1 rounded-lg shadow-md border border-slate-300 transform rotate-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageDataUrl}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>

            {/* Pink Animated Arrow */}
            <div className="p-3 rounded-full bg-pink-400 text-white shadow-lg animate-pulse">
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </div>

            {/* Right Strip Preview */}
            <div className="w-28 sm:w-36 aspect-[941/1672] rounded-xl overflow-hidden border-2 border-slate-800 bg-white shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedTemplate.assetPath}
                alt="Frame"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : (
          /* Uploading visual: Cloud doodle with arrow */
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-28 flex items-center justify-center p-4 rounded-3xl bg-white/95 text-slate-900 border-3 border-slate-800 shadow-xl">
              <UploadCloud className="w-16 h-16 text-blue-500 animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Bar */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto w-full max-w-xs">
        <div className="flex items-center justify-between w-full text-xs font-bold text-white px-1">
          <span>{isUploading ? 'Mengirim ke Monitor 2...' : 'Memproses 941×1672 px...'}</span>
          <span>{isUploading ? '85%' : '65%'}</span>
        </div>
        <div className="w-full h-3.5 bg-white/30 rounded-full overflow-hidden border border-white/50 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500 animate-pulse"
            style={{ width: isUploading ? '85%' : '65%' }}
          />
        </div>
        <div className="px-4 py-1 rounded-full bg-white/90 text-slate-800 text-[11px] font-bold border border-slate-300 shadow-sm">
          {isUploading ? 'Bentar lagi kelar! 😊' : 'Proses hampir selesai! 😊'}
        </div>
      </div>
    </div>
  );
};
