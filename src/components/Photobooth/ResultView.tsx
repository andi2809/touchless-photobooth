import React from 'react';
import { CompositeStripResult } from '@/utils/templateCompositor';
import { QRCodeDisplay } from '@/components/Gallery/QRCodeDisplay';
import { Download, RotateCcw, ExternalLink } from 'lucide-react';

interface ResultViewProps {
  finalComposite: CompositeStripResult;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  finalComposite,
  onReset,
}) => {
  const shortlink = 'https://s.id/ptik-photobooth';

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-6 pt-12 pb-12 select-none pointer-events-none bg-slate-900/60 backdrop-blur-md animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="relative mb-1">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-purple-400/80 -rotate-1 rounded-sm shadow-sm" />
          <div className="px-6 py-1.5 rounded-full bg-purple-200/95 text-purple-950 font-black text-xs sm:text-sm uppercase tracking-wider border border-purple-300 shadow-sm">
            - HERE ARE YOUR RESULTS! -
          </div>
        </div>
        <div className="px-4 py-1 rounded-full bg-white/90 text-slate-700 text-xs font-bold border border-slate-300 shadow-sm">
          Terima kasih sudah berfoto! ♡
        </div>
      </div>

      {/* Main Content: Left Strip Preview + Right Share Card */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 my-auto max-w-4xl w-full pointer-events-auto">
        {/* Left: Finished Strip */}
        <div className="relative flex flex-col items-center">
          <div className="w-36 sm:w-44 aspect-[941/1672] rounded-2xl overflow-hidden border-3 border-slate-800 bg-white shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finalComposite.dataUrl}
              alt="Hasil Photobooth"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Right: Share Card */}
        <div className="max-w-xs w-full p-5 rounded-3xl bg-blue-50/95 text-slate-900 border-2 border-blue-300 shadow-xl flex flex-col items-center text-center">
          <div className="px-3 py-1 rounded-full bg-blue-500 text-white font-black text-xs uppercase mb-3 shadow-sm">
            Share your photo!
          </div>

          <p className="text-xs text-slate-600 mb-2 font-medium">
            Bagikan hasil fotomu dengan link berikut:
          </p>

          <a
            href={shortlink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-white border border-blue-200 text-xs font-black text-blue-600 flex items-center justify-between shadow-sm hover:underline mb-4"
          >
            <span>{shortlink.replace('https://', '')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* QR Code */}
          <div className="flex items-center gap-3 w-full bg-white p-2.5 rounded-2xl border border-blue-200 shadow-sm">
            <QRCodeDisplay url={shortlink} size={70} className="shrink-0" />
            <div className="text-left text-[11px] font-bold text-slate-700 leading-tight">
              Scan QR Code untuk simpan foto ke smartphone kamu!
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Finished Action */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-400 hover:bg-pink-500 text-slate-950 font-black text-xs border-2 border-slate-800 shadow-md transition transform hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Selesai / Mulai Sesi Baru (🖐️ Lambaikan Tangan)</span>
        </button>
      </div>
    </div>
  );
};
