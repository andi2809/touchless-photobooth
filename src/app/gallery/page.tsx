'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBroadcastGallery } from '@/hooks/useBroadcastGallery';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { PolaroidPopup } from '@/components/Gallery/PolaroidPopup';
import { PhotoGrid } from '@/components/Gallery/PhotoGrid';
import { QRCodeDisplay } from '@/components/Gallery/QRCodeDisplay';
import {
  Maximize2,
  Minimize2,
  Trash2,
  ArrowLeft,
  Clock,
  ExternalLink,
  Download,
  Sparkles,
  Radio,
  Image as ImageIcon,
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

  const soundEffects = useSoundEffects();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [downloadUrl] = useState<string>('https://s.id/ptik-photobooth');

  // Track latest photo to trigger celebration animation & audio cue
  const prevPhotoIdRef = useRef<string | null>(null);
  const [isHeroPulsing, setIsHeroPulsing] = useState<boolean>(false);

  useEffect(() => {
    if (latestPhoto && latestPhoto.id !== prevPhotoIdRef.current) {
      prevPhotoIdRef.current = latestPhoto.id;
      // Play celebratory fanfare
      try {
        soundEffects.playSuccess();
      } catch (e) {}

      // Trigger pulse animation on hero strip
      setIsHeroPulsing(true);
      const timer = setTimeout(() => setIsHeroPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [latestPhoto, soundEffects]);

  // Real-time clock formatted in Indonesian locale
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

  const featuredPhoto = photos.length > 0 ? photos[0] : null;

  return (
    <div className="relative h-screen max-h-screen w-full bg-[#FAF6F0] text-slate-900 p-2 sm:p-4 flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Background Decorative Stickers (Scattered scrapbook vibe) */}
      <div className="absolute top-12 left-6 pointer-events-none opacity-40 z-0 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/sparkle_star_purple.png"
          alt=""
          className="w-8 h-8 object-contain animate-floatSlow"
        />
      </div>
      <div className="absolute top-20 right-12 pointer-events-none opacity-40 z-0 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/cloud_blue.png"
          alt=""
          className="w-16 h-10 object-contain animate-floatSlow"
        />
      </div>
      <div className="absolute bottom-12 right-6 pointer-events-none opacity-40 z-0 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/sparkle_star_yellow_large.png"
          alt=""
          className="w-10 h-10 object-contain animate-sparkle"
        />
      </div>
      <div className="absolute bottom-16 left-8 pointer-events-none opacity-40 z-0 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/decorations/flower_pink.png"
          alt=""
          className="w-8 h-8 object-contain animate-wiggle"
        />
      </div>

      {/* 1. App Window Header */}
      <header className="relative w-full px-2 sm:px-4 py-1.5 flex items-center justify-between z-30 shrink-0">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            title="Kembali ke Photobooth (Monitor 1)"
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-800 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/branding/unj.png"
              alt="UNJ"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-sans">
                  PTIK PHOTOBOOTH
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/decorations/heart_pink_small.png"
                  alt="Heart"
                  className="w-3.5 h-3.5 object-contain inline-block"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 hidden sm:block -mt-0.5">
                Pameran Karya BEMP PTIK UNJ 2026
              </span>
            </div>
          </div>
        </div>

        {/* Center: Playful Washi Banner */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 flex items-center gap-2">
          <span className="text-purple-400 font-black text-sm hidden md:inline">\\</span>
          <div className="px-5 sm:px-8 py-1 sm:py-1.5 rounded-full bg-purple-200 text-purple-950 font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-slate-900 shadow-[0_3px_0_#0f172a] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>LIVE PHOTOBOOTH SHOWCASE</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          </div>
          <span className="text-purple-400 font-black text-sm hidden md:inline">//</span>
        </div>

        {/* Right: Controls & Minimal Stats */}
        <div className="flex items-center gap-2">
          {/* Live Sync Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-slate-900 text-xs font-mono font-bold text-slate-800 shadow-sm">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>

          {/* Photo Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-200 border-2 border-slate-900 text-xs font-black text-pink-950 shadow-sm">
            <span>{photos.length} Strip Foto</span>
          </div>

          {/* Clear Gallery Button */}
          {photos.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bersihkan seluruh foto dari galeri monitor?')) {
                  clearAllPhotos();
                }
              }}
              title="Bersihkan Galeri Foto"
              className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-2 border-slate-900 transition shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-800 transition shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main Showcase Body (Digital Photobooth Wall) */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto my-auto p-1 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch overflow-hidden z-20">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: HERO PHOTO STRIP (DOMINANT!) + QR SCAN ACTION */}
        {/* ======================================================== */}
        <section className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-between gap-3 h-full overflow-hidden">
          
          {/* Main Hero Photo Strip Card */}
          <div
            className={`relative w-full max-w-[340px] sm:max-w-[380px] p-3.5 sm:p-4 rounded-[28px] sm:rounded-[36px] bg-white text-slate-900 border-3 border-slate-900 shadow-[0_16px_36px_rgba(0,0,0,0.12),0_6px_0_#0f172a] flex flex-col items-center justify-between transition-transform duration-500 ${
              isHeroPulsing ? 'scale-103 shadow-[0_20px_45px_rgba(244,114,182,0.4),0_6px_0_#ec4899]' : ''
            }`}
          >
            {/* Washi Tape on top */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 w-28 sm:w-32 h-6 -rotate-1 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decorations/washi_tape_green.png"
                alt="Tape"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Corner Decorative Stickers */}
            <div className="absolute -top-2 -right-2 z-20 w-8 h-8 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decorations/sparkle_star_yellow_large.png"
                alt="Star"
                className="w-full h-full object-contain drop-shadow animate-sparkle"
              />
            </div>

            <div className="absolute -bottom-2 -left-2 z-20 w-7 h-7 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decorations/cat_head_wink.png"
                alt="Cat"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>

            {/* Hero Header Badge */}
            <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-300 border-2 border-slate-900 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm mt-0.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
              <span>FOTO STRIP TERBARU! ✨</span>
            </div>

            {featuredPhoto ? (
              <>
                {/* 941:1672 Portrait Photo Strip Container (Dominant Height) */}
                <div className="w-full max-w-[240px] sm:max-w-[270px] aspect-[941/1672] max-h-[46vh] sm:max-h-[50vh] rounded-2xl overflow-hidden border-2 border-slate-900 bg-slate-50 shadow-md flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPhoto.imageDataUrl}
                    alt="Foto Strip Terbaru"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Strip Info & Download Button */}
                <div className="w-full flex flex-col items-center mt-2.5">
                  <div className="text-center">
                    <span className="font-mono text-xs font-black text-slate-900 block">
                      {featuredPhoto.id}
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {featuredPhoto.formattedTime} WIB
                    </span>
                  </div>

                  <a
                    href={featuredPhoto.imageDataUrl}
                    download={`PTIK-PHOTOBOOTH-${featuredPhoto.id}.png`}
                    className="mt-2 w-full max-w-[240px] flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-pink-400 hover:bg-pink-500 text-slate-950 font-black text-xs border-2 border-slate-900 shadow-[0_3px_0_#0f172a] transition transform hover:scale-102 active:translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File Asli HD</span>
                  </a>
                </div>
              </>
            ) : (
              /* Empty Hero State */
              <div className="py-14 sm:py-16 flex flex-col items-center text-center px-4">
                <div className="relative mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/decorations/camera_retro.png"
                    alt="Camera"
                    className="w-16 h-16 object-contain animate-floatSlow"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/decorations/sparkle_star_yellow_small.png"
                    alt="Star"
                    className="w-5 h-5 object-contain absolute -top-1 -right-1"
                  />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">
                  Menunggu Jepretan Pertama! 📸
                </h4>
                <p className="text-[11px] font-bold text-slate-600 max-w-[220px] leading-relaxed">
                  Foto yang diambil di Monitor 1 akan otomatis menjadi Hero di sini.
                </p>
              </div>
            )}
          </div>

          {/* QR Code & Direct Scan Card (Sticky Note Style) */}
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-[#FFF9E6] text-slate-900 border-2 border-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_3px_0_#0f172a] flex items-center justify-between gap-3">
            {/* Top mini tape */}
            <div className="absolute -top-2 left-8 w-12 h-3.5 bg-pink-300/80 -rotate-2 rounded-[2px] border-t border-b border-pink-400 pointer-events-none" />

            {/* QR Code with Doodle Frame */}
            <QRCodeDisplay
              url={downloadUrl}
              size={80}
              showDoodleFrame={false}
              className="shrink-0"
            />

            {/* Scanning Guidance */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-950 tracking-tight">
                <span>📱 SCAN UNTUK SIMPAN</span>
              </div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 my-0.5"
              >
                <span>{downloadUrl.replace('https://', '')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[10px] text-slate-600 font-semibold leading-tight">
                Buka kamera smartphone untuk langsung simpan seluruh strip fotomu! ♡
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: SCRAPBOOK GALLERY WALL (WALL OF MEMORIES) */}
        {/* ======================================================== */}
        <section className="lg:col-span-7 xl:col-span-7 flex flex-col h-full overflow-hidden">
          <div className="relative flex-1 p-3.5 sm:p-5 rounded-[28px] sm:rounded-[36px] bg-white/90 text-slate-900 border-3 border-slate-900 shadow-[0_16px_36px_rgba(0,0,0,0.08),0_6px_0_#0f172a] flex flex-col overflow-hidden">
            
            {/* Corner Doodle Sticker */}
            <div className="absolute -top-3.5 right-6 z-20 w-10 h-10 pointer-events-none hidden sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decorations/flower_purple.png"
                alt=""
                className="w-full h-full object-contain drop-shadow"
              />
            </div>

            {/* Gallery Section Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b-2 border-dashed border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-pink-100 border-2 border-slate-900 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <span>🎞️</span>
                  <span>GALERI FOTO PAMERAN</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
                  Dinding kenangan pengunjung photobooth
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300">
                  {photos.length} Total Strip
                </span>
              </div>
            </div>

            {/* Scrollable Scrapbook Photo Wall */}
            <div className="flex-1 overflow-y-auto scrapbook-scrollbar pr-1">
              <PhotoGrid photos={photos} onDeletePhoto={deletePhoto} />
            </div>
          </div>
        </section>
      </main>

      {/* 3. Aesthetic Minimal Footer */}
      <footer className="w-full px-4 py-1.5 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-600 border-t border-slate-300/80 z-30 shrink-0">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/branding/unj.png"
            alt="UNJ"
            className="w-4 h-4 object-contain"
          />
          <span className="text-[11px] text-slate-700">
            BEMP PENDIDIKAN TEKNIK INFORMATIKA • UNIVERSITAS NEGERI JAKARTA 2026
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTimeStr}</span>
        </div>
      </footer>

      {/* 4. Real-time Inbound Celebration Notification */}
      <PolaroidPopup
        photo={latestPhoto}
        onDismiss={dismissLatestPhoto}
        autoDismissSeconds={5}
      />
    </div>
  );
}
