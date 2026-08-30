'use client';

import React from 'react';
import { X, Crop, PenTool, Hand, Sparkles, ThumbsUp, CheckCircle2 } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const guides = [
    {
      title: '1. Frame Capture (Fokus & Shutter)',
      description: 'Bentuk kotak bingkai menggunakan 2 tangan (jempol & telunjuk). Tahan selama 3 detik untuk memicu countdown & foto otomatis dengan efek latar belakang blur bokeh.',
      icon: <Crop className="w-6 h-6 text-neon-cyan" />,
      tag: 'Tahan 3 Detik',
      borderColor: 'border-cyan-500/40',
      bgGlow: 'from-cyan-950/40 to-slate-900/60',
    },
    {
      title: '2. Air Drawing (Melukis Neon di Udara)',
      description: 'Acungkan hanya 1 jari telunjuk (lipat jari lainnya) dan gerakkan di udara untuk melukis garis neon bercahaya di layar.',
      icon: <PenTool className="w-6 h-6 text-neon-pink" />,
      tag: '1 Jari Telunjuk',
      borderColor: 'border-pink-500/40',
      bgGlow: 'from-pink-950/40 to-slate-900/60',
    },
    {
      title: '3. Hapus Coretan (Wipe Canvas)',
      description: 'Buka seluruh 5 jari telapak tangan menghadap kamera untuk menghapus seluruh coretan neon dan mereset timer.',
      icon: <Hand className="w-6 h-6 text-amber-400" />,
      tag: 'Telapak Terbuka',
      borderColor: 'border-amber-500/40',
      bgGlow: 'from-amber-950/40 to-slate-900/60',
    },
    {
      title: '4. Peace Sign (✌️ Peace Blur)',
      description: 'Bentuk pose 2 jari (Peace) untuk mengaktifkan efek instan pose legendaris PTI BEMP.',
      icon: <Sparkles className="w-6 h-6 text-neon-green" />,
      tag: 'Pose 2 Jari',
      borderColor: 'border-emerald-500/40',
      bgGlow: 'from-emerald-950/40 to-slate-900/60',
    },
    {
      title: '5. Thumbs Up (👍 Pose Mantap)',
      description: 'Acungkan jempol untuk memicu konfirmasi atau pose ikonik.',
      icon: <ThumbsUp className="w-6 h-6 text-neon-gold" />,
      tag: 'Jempol',
      borderColor: 'border-yellow-500/40',
      bgGlow: 'from-yellow-950/40 to-slate-900/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-neon-cyan shadow-neon-cyan">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Panduan Gestur Touchless Photobooth</h2>
            <p className="text-xs text-slate-400">Interaksi 100% tanpa sentuhan menggunakan AI MediaPipe Vision</p>
          </div>
        </div>

        {/* Gesture Grid */}
        <div className="space-y-3">
          {guides.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 p-4 rounded-2xl border bg-gradient-to-r ${item.bgGlow} ${item.borderColor} backdrop-blur-sm transition hover:scale-[1.01]`}
            >
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-slate-300">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dual Display Info */}
        <div className="mt-5 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
          <p>
            <strong>Dual-Monitor Support:</strong> Buka tautan <span className="text-neon-cyan font-mono font-bold">/gallery</span> pada layar monitor kedua. Foto akan tersinkronisasi otomatis secara real-time via BroadcastChannel tanpa jeda!
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-neon-cyan transition"
          >
            Mulai Berfoto 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
