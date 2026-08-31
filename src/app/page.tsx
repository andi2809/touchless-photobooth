'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHandLandmarker } from '@/hooks/useHandLandmarker';
import { useBoothStateMachine } from '@/hooks/useBoothStateMachine';
import { GestureStabilizer } from '@/utils/gestureDetector';
import { NormalizedLandmark } from '@/types/photobooth';
import { HandLandmarkCanvas } from '@/components/Photobooth/HandLandmarkCanvas';
import { IdleView } from '@/components/Photobooth/IdleView';
import { FrameSelectionView } from '@/components/Photobooth/FrameSelectionView';
import { CameraReadyView } from '@/components/Photobooth/CameraReadyView';
import { CountdownView } from '@/components/Photobooth/CountdownView';
import { CompositingView } from '@/components/Photobooth/CompositingView';
import { ResultView } from '@/components/Photobooth/ResultView';
import { GestureGuideModal } from '@/components/Photobooth/GestureGuideModal';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
  RefreshCw,
  Camera,
  Activity,
} from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopBlockerOverlay } from '@/components/DesktopBlockerOverlay';
import Link from 'next/link';

function PhotoboothContent() {
  // 1. MediaPipe AI & Camera Stream Hook
  const {
    isLoading,
    isModelReady,
    isCameraActive,
    errorMessage: cameraError,
    fps,
    videoRef,
    startCamera,
    detectHands,
  } = useHandLandmarker({
    numHands: 4,
    minDetectionConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // 2. State Machine Hook
  const {
    state,
    session,
    templateIndex,
    allTemplates,
    countdown,
    isFlashing,
    lastTriggeredGesture,
    handleGestureEvent,
    resetSession,
    startSessionManually,
    selectNextFrame,
    selectPrevFrame,
    confirmFrameManually,
    triggerPeaceManually,
    retryUploadManually,
    soundEffects,
  } = useBoothStateMachine(videoRef, isGuideOpen, setIsGuideOpen);

  // 3. Landmarks & Gesture Refs (Decouples 60 FPS Canvas rendering from React re-renders)
  const gestureStabilizerRef = useRef<GestureStabilizer>(new GestureStabilizer());
  const landmarksRef = useRef<NormalizedLandmark[][]>([]);
  const activeGestureRef = useRef<string>('IDLE');

  const [activeContinuousGesture, setActiveContinuousGesture] = useState<string>('IDLE');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [handsCount, setHandsCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showDevDebug, setShowDevDebug] = useState<boolean>(false);
  const showDevDebugRef = useRef<boolean>(showDevDebug);
  useEffect(() => { showDevDebugRef.current = showDevDebug; }, [showDevDebug]);

  const lastDebugUpdateRef = useRef<number>(0);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Main Detection Loop (60 FPS MediaPipe Evaluation & Direct Skeleton Feeding)
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (videoRef.current && isCameraActive && isModelReady) {
        const detectedHands = detectHands(videoRef.current, timestamp);
        landmarksRef.current = detectedHands;

        // Process through Gesture Stabilizer
        const result = gestureStabilizerRef.current.processFrame(detectedHands, timestamp);
        activeGestureRef.current = result.activeContinuousGesture;

        // Dispatch discrete edge-triggered event to State Machine
        if (result.triggeredEvent) {
          handleGestureEvent(result.triggeredEvent);
        }

        // Throttle debug HUD state updates to 4 times a second (250ms) to eliminate React re-render overhead
        if (showDevDebugRef.current && timestamp - lastDebugUpdateRef.current >= 250) {
          lastDebugUpdateRef.current = timestamp;
          setActiveContinuousGesture(result.activeContinuousGesture);
          setGestureConfidence(result.confidence);
          setHandsCount(detectedHands.length);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, isModelReady, detectHands, videoRef, handleGestureEvent]);

  // Keyboard Shortcuts for Testing & Operation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        selectPrevFrame();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        selectNextFrame();
      } else if (e.code === 'KeyT' || e.code === 'Enter') {
        e.preventDefault();
        if (state === 'IDLE') startSessionManually();
        else if (state === 'FRAME_SELECTION') confirmFrameManually();
      } else if (e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault();
        if (state === 'READY') triggerPeaceManually();
      } else if (e.code === 'Escape' || e.code === 'Backspace') {
        e.preventDefault();
        resetSession();
      } else if (e.code === 'KeyD') {
        setShowDevDebug((prev) => !prev);
      } else if (e.code === 'KeyS') {
        setShowSkeleton((prev) => !prev);
      } else if (e.code === 'KeyR') {
        retryUploadManually();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state,
    selectPrevFrame,
    selectNextFrame,
    startSessionManually,
    confirmFrameManually,
    triggerPeaceManually,
    resetSession,
    retryUploadManually,
  ]);

  // Dynamic Header Title based on state
  const stateTitleMap: Record<string, string> = {
    IDLE: 'TOUCHLESS PHOTOBOOTH',
    FRAME_SELECTION: 'PILIH FRAME KAMU!',
    READY: 'GET READY!',
    COUNTDOWN: 'SMILE BIG!',
    CAPTURE: 'SAY CHEESE!',
    COMPOSITING: 'MENGGABUNG FOTO...',
    UPLOADING: 'MENGUPLOAD KE DRIVE...',
    RESULT: 'HERE ARE YOUR RESULTS!',
    RESETTING: 'TERIMA KASIH!',
  };

  const currentTemplate = session.selectedTemplate || allTemplates[templateIndex] || allTemplates[0];

  return (
    <main className="relative w-screen h-screen bg-[#F7F2EB] p-2 sm:p-3 overflow-hidden select-none font-sans text-slate-900 flex flex-col justify-between">
      {/* 1. Outer App Window Header Bar */}
      <header className="relative w-full px-3 py-1 flex items-center justify-between z-40">
        {/* Left: PTIK Logo & Doodle Camera */}
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/camera_retro.png"
            alt="Camera"
            className="w-8 h-8 object-contain"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-800 font-sans">
              PTIK PHOTOBOOTH
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/decorations/heart_pink_small.png"
              alt="Heart"
              className="w-4 h-4 object-contain inline-block"
            />
          </div>
        </div>

        {/* Center: Pink Washi Banner with Sunburst Ticks */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 flex items-center gap-2">
          <span className="text-pink-400 font-bold hidden sm:inline">\\</span>
          <div className="px-5 sm:px-8 py-1.5 rounded-full bg-pink-200/95 text-pink-950 font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-pink-300 shadow-sm flex items-center gap-2">
            <span>-</span>
            <span>{stateTitleMap[state] || 'TOUCHLESS PHOTOBOOTH'}</span>
            <span>-</span>
          </div>
          <span className="text-pink-400 font-bold hidden sm:inline">//</span>
        </div>

        {/* Right: BEMP PTIK 2026 Ribbon & Controls */}
        <div className="flex items-center gap-2">
          {/* BEMP PTIK 2026 Ribbon */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-xs font-black shadow-sm">
            <span>⭐</span>
            <span>BEMP PTIK 2026</span>
          </div>

          {/* Skeleton Landmark Toggle */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            title={showSkeleton ? 'Sembunyikan Skeleton Tangan (S)' : 'Tampilkan Skeleton Tangan (S)'}
            className={`p-2 rounded-xl border transition ${
              showSkeleton
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => soundEffects.toggleMute()}
            title={soundEffects.isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition shadow-sm"
          >
            {soundEffects.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Debug Compositor Link */}
          <Link
            href="/debug/compositor"
            className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-700 transition shadow-sm"
          >
            Compositor
          </Link>
        </div>
      </header>

      {/* 2. Main Center Viewfinder (Camera Box with Rounded Border & Corner Brackets) */}
      <div className="relative flex-1 w-full max-h-[89vh] my-auto rounded-[32px] overflow-hidden border-3 border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-3 border-l-3 border-white/60 pointer-events-none z-30 rounded-tl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-3 border-r-3 border-white/60 pointer-events-none z-30 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-3 border-l-3 border-white/60 pointer-events-none z-30 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-3 border-r-3 border-white/60 pointer-events-none z-30 rounded-br" />

        {/* 2.1 Live Mirrored Video Stream */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 2.2 Real-time MediaPipe Hand Landmarks & Detailed Smoothed Skeleton Canvas */}
        <HandLandmarkCanvas
          landmarksRef={landmarksRef}
          activeGestureRef={activeGestureRef}
          isMirrored={true}
          isVisible={showSkeleton}
        />

        {/* 2.3 Shutter Flash Effect */}
        <div
          className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-300 z-40 ${
            isFlashing ? 'opacity-95' : 'opacity-0'
          }`}
        />

        {/* 2.4 Cute Tips Sticky Note (Shown only on IDLE state) */}
        {state === 'IDLE' && (
          <aside className="absolute top-4 right-6 z-30 pointer-events-auto hidden md:block animate-fade-in">
            <div className="relative p-3 rounded-2xl bg-[#FFF6D6] text-slate-800 border-2 border-amber-300 shadow-lg rotate-2 max-w-[170px] text-left">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-pink-400/80 -rotate-2 rounded-sm shadow-sm" />
              <div className="flex items-center gap-1 text-xs font-black text-amber-900 mb-0.5">
                <span>💡</span>
                <span>Tips</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-700 leading-tight">
                Berdiri di depan kamera dan pastikan tanganmu terlihat jelas! ♡
              </p>
            </div>
          </aside>
        )}

        {/* 2.5 State-Driven UI Overlays */}
        {state === 'IDLE' && (
          <IdleView
            onStart={startSessionManually}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {state === 'FRAME_SELECTION' && (
          <FrameSelectionView
            allTemplates={allTemplates}
            currentIndex={templateIndex}
            onSelectPrev={selectPrevFrame}
            onSelectNext={selectNextFrame}
            onConfirm={confirmFrameManually}
            onCancel={resetSession}
          />
        )}

        {state === 'READY' && (
          <CameraReadyView
            currentPhotoIndex={session.currentPhotoIndex}
            templateName={currentTemplate.name}
            onTriggerPeace={triggerPeaceManually}
            onCancel={resetSession}
          />
        )}

        {state === 'COUNTDOWN' && (
          <CountdownView
            countdown={countdown}
            currentPhotoIndex={session.currentPhotoIndex}
          />
        )}

        {(state === 'COMPOSITING' || state === 'UPLOADING') && (
          <CompositingView
            state={state}
            photos={session.photos}
            selectedTemplate={currentTemplate}
          />
        )}

        {state === 'RESULT' && session.finalComposite && (
          <ResultView
            finalComposite={session.finalComposite}
            onReset={resetSession}
            uploadStatus={session.uploadStatus}
          />
        )}
      </div>

      {/* 3. Outer Frame Corner Decorative Stickers */}
      <div className="absolute bottom-2 left-4 pointer-events-none hidden lg:block z-40">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/cloud_blue.png"
            alt="Cloud"
            className="w-16 h-10 object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/flower_pink.png"
            alt="Flower"
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-2 right-4 pointer-events-none hidden lg:block z-40">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/flower_purple.png"
            alt="Flower"
            className="w-8 h-8 object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/decorations/cat_head_wink.png"
            alt="Cat"
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>

      {/* 4. Development Minimal Debug Overlay (Toggle with key 'D') */}
      {showDevDebug && (
        <aside className="absolute top-16 right-6 z-50 p-4 rounded-2xl bg-white/95 text-slate-900 border-2 border-slate-800 shadow-2xl backdrop-blur-md text-xs font-mono space-y-2 w-72 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-900 font-black">
            <span>🛠️ TOUCHLESS DEBUG</span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">{fps} FPS</span>
          </div>

          <div className="space-y-1.5 text-slate-700 text-[11px]">
            <div className="flex justify-between">
              <span>Hand Detected:</span>
              <span className={`font-bold ${handsCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {handsCount > 0 ? `YES (${handsCount} Hand)` : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gesture:</span>
              <span className="font-bold text-pink-600">
                {activeContinuousGesture !== 'IDLE' ? activeContinuousGesture : 'NONE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-bold text-slate-800">{(gestureConfidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Camera Status:</span>
              <span className={`font-bold ${isCameraActive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isCameraActive ? 'ACTIVE' : 'ERROR/OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>MediaPipe:</span>
              <span className={`font-bold ${isModelReady ? 'text-emerald-600' : 'text-amber-500'}`}>
                {isModelReady ? 'READY' : 'LOADING'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current State:</span>
              <span className="font-bold text-blue-600">{state}</span>
            </div>
            <div className="flex justify-between">
              <span>Photo Index:</span>
              <span className="font-bold text-slate-800">{session.currentPhotoIndex + 1} / 3</span>
            </div>
            <div className="flex justify-between">
              <span>Current Frame:</span>
              <span className="truncate max-w-[120px] font-bold text-slate-900">{currentTemplate.name}</span>
            </div>
            {session.uploadStatus && (
              <div className="flex justify-between">
                <span>Upload Status:</span>
                <span className={`font-bold ${
                  session.uploadStatus === 'SUCCESS' ? 'text-emerald-600' :
                  session.uploadStatus === 'FAILED' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {session.uploadStatus}
                </span>
              </div>
            )}
            {session.uploadError && (
              <div className="mt-1 p-1 bg-red-100 text-red-700 text-[9px] rounded line-clamp-2">
                {session.uploadError}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
            <div>⌨️ [← / →] Geser Frame</div>
            <div>⌨️ [T / Enter] Confirm Frame / Start</div>
            <div>⌨️ [Space / P] Peace Gesture (Capture)</div>
            <div>⌨️ [Esc] Reset Sesi</div>
            <div>⌨️ [S] Toggle Skeleton Tangan</div>
            <div>⌨️ [D] Toggle Debug Panel</div>
            <div>⌨️ [R] Retry Failed Upload</div>
          </div>
        </aside>
      )}

      {/* 5. Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 6. Camera Error / Initializing Overlay */}
      {(!isCameraActive || isLoading) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 text-center text-white select-none">
          {cameraError ? (
            <div className="max-w-md p-8 rounded-3xl bg-white text-slate-900 border-3 border-slate-800 shadow-2xl flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-bounce" />
              <h2 className="text-lg font-black text-slate-900 mb-2">Akses Kamera Diperlukan</h2>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">{cameraError}</p>
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Hubungkan Kamera Lagi</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-pink-400/30 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-t-pink-400 border-r-amber-400 border-b-cyan-400 border-l-transparent animate-spin" />
                <Camera className="absolute w-7 h-7 text-pink-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mb-1">
                Memuat Touchless Engine & MediaPipe AI...
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Akselerasi GPU lokal siap mendeteksi gestur tangan bebas sentuh secara instan.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function PhotoboothPage() {
  const { isDesktop, windowWidth, minWidth } = useIsDesktop(1024);

  // During SSR or initial client mounting, display minimal dark placeholder to prevent hydration flash
  if (isDesktop === null) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 rounded-full border-3 border-pink-400/40 border-t-pink-400 animate-spin mb-3" />
        <span className="text-xs font-mono text-slate-500">Memeriksa ukuran layar...</span>
      </div>
    );
  }

  // If Mobile or Small Screen (< 1024px), DO NOT MOUNT PhotoboothContent (saves 100% CPU/GPU & prevents camera prompt)
  if (!isDesktop) {
    return (
      <DesktopBlockerOverlay
        windowWidth={windowWidth}
        minWidth={minWidth}
        title="Layar Terlalu Kecil"
        description="Aplikasi Touchless Photobooth ini dirancang khusus untuk layar Desktop atau Laptop dengan sistem deteksi gestur AI bebas sentuh."
      />
    );
  }

  // Desktop Screen (>= 1024px): Mount full photobooth app
  return <PhotoboothContent />;
}
