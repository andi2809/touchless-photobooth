'use client';

import React from 'react';
import { ActiveGesture, PhotoboothFrameId } from '@/types/photobooth';
import { NEON_COLORS } from './AirCanvas';
import {
  Camera,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Eraser,
  Hand,
  PenTool,
  ThumbsUp,
  Crop,
  Layers,
  Sparkle,
} from 'lucide-react';
import Link from 'next/link';

export const PHOTOBOOTH_FRAMES = [
  { id: 'none' as PhotoboothFrameId, name: 'Tanpa Frame', tag: 'Standard', color: '#94a3b8' },
  { id: 'cyber' as PhotoboothFrameId, name: 'Cyber PTI', tag: 'Neon Sci-Fi', color: '#00f0ff' },
  { id: 'retro' as PhotoboothFrameId, name: 'Retro Polaroid', tag: 'Aesthetic Y2K', color: '#ffb6c1' },
  { id: 'comic' as PhotoboothFrameId, name: 'Comic Manga', tag: 'Pop Art', color: '#ffe600' },
];

interface ControlHeaderProps {
  fps: number;
  activeGesture: ActiveGesture;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  selectedFrameId: PhotoboothFrameId;
  onSelectFrame: (frameId: PhotoboothFrameId) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  availableCameras: { deviceId: string; label: string }[];
  selectedCameraId: string;
  onSelectCamera: (deviceId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClearDrawing: () => void;
  onOpenGuide: () => void;
  onManualCapture: () => void;
  hoveredTargetId?: string | null;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  fps,
  activeGesture,
  selectedColor,
  onSelectColor,
  selectedFrameId,
  onSelectFrame,
  brushSize,
  onChangeBrushSize,
  availableCameras,
  selectedCameraId,
  onSelectCamera,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onClearDrawing,
  onOpenGuide,
  onManualCapture,
  hoveredTargetId,
}) => {
  const getGestureInfo = (gesture: ActiveGesture) => {
    switch (gesture) {
      case 'FRAME_CAPTURE':
        return {
          label: 'Framing Focus Active',
          colorClass: 'bg-cyan-500/20 text-neon-cyan border-cyan-400/50 shadow-neon-cyan',
          icon: <Crop className="w-4 h-4 animate-pulse text-neon-cyan" />,
        };
      case 'AIR_DRAW':
        return {
          label: 'Air Drawing / Touchless Point',
          colorClass: 'bg-pink-500/20 text-neon-pink border-pink-400/50 shadow-neon-pink',
          icon: <PenTool className="w-4 h-4 animate-bounce text-neon-pink" />,
        };
      case 'OPEN_PALM':
        return {
          label: 'Canvas Wiped / Palm',
          colorClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
          icon: <Hand className="w-4 h-4 text-amber-300" />,
        };
      case 'PEACE':
        return {
          label: 'Peace Sign Detected',
          colorClass: 'bg-emerald-500/20 text-neon-green border-emerald-400/50 shadow-neon-green',
          icon: <Sparkles className="w-4 h-4 text-neon-green" />,
        };
      case 'THUMBS_UP':
        return {
          label: 'Thumbs Up Detected',
          colorClass: 'bg-yellow-500/20 text-neon-gold border-yellow-400/50 shadow-neon-gold',
          icon: <ThumbsUp className="w-4 h-4 text-neon-gold" />,
        };
      default:
        return {
          label: 'Arahkan Telunjuk / Gestur',
          colorClass: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
          icon: <Layers className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const gestureInfo = getGestureInfo(activeGesture);

  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none flex flex-col gap-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
      {/* Upper Bar: Branding, Active Gesture, and Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Branding & FPS */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/70 backdrop-blur-md shadow-glass">
            <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse shadow-neon-cyan" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide text-white">
              PTI <span className="text-neon-cyan">PHOTOBOOTH</span>
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              AI M4
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/70 backdrop-blur-md text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{fps} FPS</span>
          </div>
        </div>

        {/* Center: Active Gesture Badge */}
        <div className="pointer-events-auto">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide backdrop-blur-md transition-all duration-200 ${gestureInfo.colorClass}`}
          >
            {gestureInfo.icon}
            <span>{gestureInfo.label}</span>
          </div>
        </div>

        {/* Right: Camera Selector & Utility Actions */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => onSelectCamera(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/70 backdrop-blur-md text-xs text-white focus:outline-none focus:border-neon-cyan"
            >
              {availableCameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId} className="bg-slate-900 text-white">
                  {cam.label}
                </option>
              ))}
            </select>
          )}

          {/* Touchless Target: Manual Shutter */}
          <button
            id="touchless-capture"
            data-touchless-id="touchless-capture"
            onClick={onManualCapture}
            title="Ambil Foto (atau Tahan Kursor 1.2s)"
            className={`relative p-2 rounded-xl border backdrop-blur-md transition ${
              hoveredTargetId === 'touchless-capture'
                ? 'bg-neon-cyan/40 border-neon-cyan text-black scale-110 shadow-neon-cyan ring-2 ring-white'
                : 'bg-neon-cyan/20 border-cyan-400/50 text-neon-cyan hover:bg-neon-cyan/30 shadow-neon-cyan'
            }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Mute Audio */}
          <button
            id="touchless-mute"
            data-touchless-id="touchless-mute"
            onClick={onToggleMute}
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            className={`p-2 rounded-xl border backdrop-blur-md transition ${
              hoveredTargetId === 'touchless-mute'
                ? 'bg-slate-700 border-white text-white scale-110'
                : 'bg-slate-900/85 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Guide Modal */}
          <button
            id="touchless-guide"
            data-touchless-id="touchless-guide"
            onClick={onOpenGuide}
            title="Panduan Gestur"
            className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}
            className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Monitor 2 Link */}
          <Link
            href="/gallery"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Live Gallery di Layar Monitor 2"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-neon-pink/30 to-purple-600/30 hover:from-neon-pink/40 hover:to-purple-600/40 text-pink-200 border border-pink-500/40 backdrop-blur-md text-xs font-semibold transition shadow-neon-pink"
          >
            <span>Monitor 2</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Lower Interactive Touchless HUD: Neon Palette & Generated Frame Selector */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto flex-wrap">
        {/* Left: Neon Color Selector with Hover Dwell Targets */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-glass">
          <span className="text-[10px] font-mono uppercase text-slate-400 px-1 font-bold">Neon:</span>
          {NEON_COLORS.map((c) => {
            const touchlessId = `touchless-${c.id}`;
            const isHovered = hoveredTargetId === touchlessId;
            const isSelected = selectedColor === c.hex;

            return (
              <button
                key={c.hex}
                id={touchlessId}
                data-touchless-id={touchlessId}
                onClick={() => onSelectColor(c.hex)}
                title={`Warna Neon ${c.name} (Tahan kursor 1.2s untuk memilih)`}
                className={`relative w-6 h-6 rounded-full transition-all duration-150 ${c.bgClass} ${
                  isSelected
                    ? 'scale-125 ring-2 ring-white shadow-lg'
                    : isHovered
                    ? 'scale-125 ring-2 ring-neon-cyan shadow-neon-cyan'
                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                }`}
              />
            );
          })}

          {/* Clear Air Drawing Touchless Target */}
          <button
            id="touchless-clear"
            data-touchless-id="touchless-clear"
            onClick={onClearDrawing}
            title="Hapus Coretan (Tahan kursor 1.2s atau buka telapak tangan)"
            className={`p-1.5 rounded-xl transition ${
              hoveredTargetId === 'touchless-clear'
                ? 'bg-red-500 text-white scale-110 ring-2 ring-red-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Generated Photobooth Frame Selector with Hover Dwell Targets */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-glass">
          <span className="text-[10px] font-mono uppercase text-slate-400 px-1 font-bold">Frame:</span>
          {PHOTOBOOTH_FRAMES.map((f) => {
            const touchlessId = `touchless-frame-${f.id}`;
            const isHovered = hoveredTargetId === touchlessId;
            const isSelected = selectedFrameId === f.id;

            return (
              <button
                key={f.id}
                id={touchlessId}
                data-touchless-id={touchlessId}
                onClick={() => onSelectFrame(f.id)}
                title={`Pilih Frame ${f.name} (Tahan kursor 1.2s)`}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 border ${
                  isSelected
                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-neon-cyan scale-105'
                    : isHovered
                    ? 'bg-slate-800 border-white text-white scale-105 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
