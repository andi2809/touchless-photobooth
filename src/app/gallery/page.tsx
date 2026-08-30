'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBroadcastGallery } from '@/hooks/useBroadcastGallery';
import { PolaroidPopup } from '@/components/Gallery/PolaroidPopup';
import { PhotoGrid } from '@/components/Gallery/PhotoGrid';
import { QRCodeDisplay } from '@/components/Gallery/QRCodeDisplay';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  ArrowLeft,
  Radio,
  Clock,
  Images,
  ExternalLink,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

export default function GalleryShowcasePage() {
  const {
    photos,
    latestPhoto,
    isConnected,
    dismissLatestPhoto,
    deletePhoto,
    clearAllPhotos,
  } = useBroadcastGallery();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [downloadUrl] = useState<string>('https://s.id/foto-maba-pti');

  // Real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ' • ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col justify-between selection:bg-neon-pink selection:text-white">
      {/* Animated Vibrant Colorful Mesh Glow Aura Elements */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/25 filter blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 rounded-full bg-fuchsia-600/25 filter blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 rounded-full bg-yellow-500/20 filter blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Top Showcase Navigation Bar */}
      <header className="sticky top-0 z-40 px-6 py-4 bg-slate-950/70 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4 shadow-glass">
        {/* Left: Branding & Event Tag */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            title="Kembali ke Photobooth"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-neon-cyan via-white to-neon-pink bg-clip-text text-transparent drop-shadow-sm">
                LIVE GALLERY SHOWCASE
              </span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold shadow-neon-pink">
                <Flame className="w-3 h-3" />
                <span>Monitor 2</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">Pameran Karya & Interaksi BEMP PTI UNJ 2026</p>
          </div>
        </div>

        {/* Center: Live Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/15 text-xs font-mono backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-200">
            {isConnected ? 'BROADCASTCHANNEL CONNECTED (0ms LATENCY)' : 'CONNECTING SYNC...'}
          </span>
        </div>

        {/* Right: Controls & Stats */}
        <div className="flex items-center gap-3">
          {/* Photo Counter Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-400/40 text-xs font-mono text-cyan-300 shadow-neon-cyan backdrop-blur-md">
            <Images className="w-4 h-4" />
            <span className="font-bold">{photos.length} Foto Terabadikan</span>
          </div>

          {/* Clear Gallery Button */}
          {photos.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bersihkan seluruh foto dari galeri monitor?')) {
                  clearAllPhotos();
                }
              }}
              title="Bersihkan Galeri"
              className="p-2 rounded-xl bg-black/40 hover:bg-red-900/60 hover:text-red-300 border border-white/15 text-slate-400 transition backdrop-blur-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Display (F11)'}
            className="p-2 rounded-xl bg-black/40 hover:bg-white/20 border border-white/15 text-white transition backdrop-blur-md"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Masonry Grid Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 mb-28">
        <PhotoGrid photos={photos} onDeletePhoto={deletePhoto} />
      </main>

      {/* Persistent Frosted Glass High-Contrast Neon Bottom Banner */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t-2 border-neon-cyan px-6 py-3 shadow-[0_-10px_35px_rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Download Shortlink & Instructions */}
        <div className="flex items-center gap-4">
          <QRCodeDisplay url={downloadUrl} size={68} className="border-2 border-neon-cyan shadow-neon-cyan shrink-0" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-black text-neon-gold tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SCAN UNTUK AKSES & UNDUH FOTO</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            </div>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg sm:text-xl font-black text-neon-cyan hover:text-white hover:underline tracking-wide flex items-center gap-1.5 transition"
            >
              <span>{downloadUrl.replace('https://', '')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[11px] text-slate-300 font-medium">
              Foto yang baru diambil langsung tersedia untuk diunduh ke smartphone Anda!
            </p>
          </div>
        </div>

        {/* Right: Live Event Clock & Credits */}
        <div className="hidden md:flex flex-col items-end text-right text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-neon-cyan" />
            <span>{currentTimeStr}</span>
          </div>
          <span className="text-[11px] font-extrabold text-slate-300 mt-1">
            BEMP PENDIDIKAN TEKNIK INFORMATIKA • UNIVERSITAS NEGERI JAKARTA
          </span>
        </div>
      </footer>

      {/* Real-time Incoming Polaroid Pop-up Modal with Confetti */}
      <PolaroidPopup
        photo={latestPhoto}
        onDismiss={dismissLatestPhoto}
        autoDismissSeconds={4}
      />
    </div>
  );
}
