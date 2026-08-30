'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandLandmarker } from '@/hooks/useHandLandmarker';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBroadcastGallery } from '@/hooks/useBroadcastGallery';
import { evaluateGestures, smoothBoundingBox, smoothPoint } from '@/utils/gestureMath';
import { createCompositePhoto } from '@/utils/frameComposite';
import {
  BoundingBox,
  NormalizedLandmark,
  ActiveGesture,
  CaptureStage,
  PhotoboothFrameId,
  DrawingStroke,
  DrawingPoint,
  CapturedPhoto,
  VirtualCursorState,
} from '@/types/photobooth';
import { CameraView } from '@/components/Photobooth/CameraView';
import { ControlHeader } from '@/components/Photobooth/ControlHeader';
import { GestureGuideModal } from '@/components/Photobooth/GestureGuideModal';
import { PhotoPreviewModal } from '@/components/Photobooth/PhotoPreviewModal';
import { Sparkles, Camera, AlertCircle, RefreshCw } from 'lucide-react';

const LOCK_HOLD_DURATION_MS = 2000; // 2.0s hold to permanently lock frame area
const FREE_POSE_COUNTDOWN_SEC = 3;   // 3s free pose countdown once locked
const DWELL_TRIGGER_DURATION_MS = 1200; // 1.2s hover dwell to select UI button

export default function PhotoboothPage() {
  // 1. Core Hooks
  const {
    isLoading,
    isModelReady,
    isCameraActive,
    errorMessage,
    availableCameras,
    selectedCameraId,
    videoDimensions,
    fps,
    videoRef,
    startCamera,
    switchCamera,
    detectHands,
  } = useHandLandmarker({ numHands: 4 });

  const {
    isMuted,
    toggleMute,
    playShutter,
    playCountdownBeep,
    playFrameLock,
    playClearChime,
    playSuccess,
  } = useSoundEffects();

  const { broadcastPhoto } = useBroadcastGallery();

  // 2. Photobooth Reactive State
  const [activeGesture, setActiveGesture] = useState<ActiveGesture>('IDLE');
  const [stage, setStage] = useState<CaptureStage>('IDLE');
  const [frameBox, setFrameBox] = useState<BoundingBox | null>(null);
  const [allHandsLandmarks, setAllHandsLandmarks] = useState<NormalizedLandmark[][]>([]);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#00f0ff');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [selectedFrameId, setSelectedFrameId] = useState<PhotoboothFrameId>('cyber');

  // Countdown & Flash
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lockProgress, setLockProgress] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Touchless Virtual Hover Dwell Cursor State
  const [virtualCursor, setVirtualCursor] = useState<VirtualCursorState>({
    x: 0,
    y: 0,
    isActive: false,
    hoveredTargetId: null,
    dwellProgress: 0,
  });

  // 3. Persistent Refs for Timing & Locks
  const stageRef = useRef<CaptureStage>('IDLE');
  stageRef.current = stage;

  const lockHoldStartRef = useRef<number | null>(null);
  const lockedFrameBoxRef = useRef<BoundingBox | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevFrameBoxRef = useRef<BoundingBox | null>(null);
  const prevDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const prevCursorPosRef = useRef<{ x: number; y: number } | null>(null);

  // Hover Dwell Refs
  const currentHoverIdRef = useRef<string | null>(null);
  const hoverStartTimeRef = useRef<number | null>(null);
  const lastDwellTriggeredIdRef = useRef<string | null>(null);
  const palmCooldownRef = useRef<number>(0);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Clear air drawing strokes
  const handleClearDrawing = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    prevDrawPointRef.current = null;
    playClearChime();
  }, [playClearChime]);

  // Execute snapshot capture
  const handleExecuteSnapshot = useCallback(async () => {
    if (!videoRef.current) return;
    setStage('CAPTURING');

    // Trigger visual flash & shutter sound
    setIsFlashing(true);
    playShutter();
    setTimeout(() => setIsFlashing(false), 400);

    try {
      const activeBox = lockedFrameBoxRef.current || frameBox;
      const photo = await createCompositePhoto({
        video: videoRef.current,
        strokes,
        frameBox: activeBox,
        frameId: selectedFrameId,
        eventName: 'FOTO KITA BLUR • PTI BEMP 2026',
        applyBlurEffect: true,
      });

      // Broadcast to Monitor 2 Live Gallery
      broadcastPhoto(photo);
      setCapturedPhoto(photo);
      playSuccess();

      // Clear drawing strokes for fresh next session
      setStrokes([]);
      setCurrentStroke([]);
    } catch (err) {
      console.error('[Photobooth] Error creating composite snapshot:', err);
    } finally {
      setStage('SAVED_PREVIEW');
      lockedFrameBoxRef.current = null;
      setFrameBox(null);
      setCountdown(null);
      setLockProgress(0);
      lockHoldStartRef.current = null;
    }
  }, [videoRef, strokes, frameBox, selectedFrameId, playShutter, broadcastPhoto, playSuccess]);

  // Start Stage 2 Free Pose Countdown once locked
  const startFreePoseCountdown = useCallback(() => {
    setStage('LOCKED_COUNTDOWN');
    let currentSec = FREE_POSE_COUNTDOWN_SEC;
    setCountdown(currentSec);
    playCountdownBeep(false);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec > 0) {
        setCountdown(currentSec);
        playCountdownBeep(currentSec === 1);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
        handleExecuteSnapshot();
      }
    }, 1000);
  }, [handleExecuteSnapshot, playCountdownBeep]);

  // Manual Capture Trigger
  const handleManualCapture = useCallback(() => {
    if (stageRef.current === 'CAPTURING') return;
    handleExecuteSnapshot();
  }, [handleExecuteSnapshot]);

  // Action Dispatcher for Touchless Dwell Selection
  const handleDwellSelect = useCallback(
    (targetId: string) => {
      playFrameLock();

      if (targetId.startsWith('touchless-color-')) {
        const colorName = targetId.replace('touchless-color-', '');
        const map: Record<string, string> = {
          cyan: '#00f0ff',
          magenta: '#ff007f',
          gold: '#ffe600',
          lime: '#00ff66',
          purple: '#b026ff',
          white: '#ffffff',
        };
        if (map[colorName]) setSelectedColor(map[colorName]);
      } else if (targetId.startsWith('touchless-frame-')) {
        const frame = targetId.replace('touchless-frame-', '') as PhotoboothFrameId;
        setSelectedFrameId(frame);
      } else if (targetId === 'touchless-clear') {
        handleClearDrawing();
      } else if (targetId === 'touchless-capture') {
        handleManualCapture();
      } else if (targetId === 'touchless-mute') {
        toggleMute();
      } else if (targetId === 'touchless-guide') {
        setIsGuideOpen((prev) => !prev);
      }
    },
    [playFrameLock, handleClearDrawing, handleManualCapture, toggleMute]
  );

  // Main Detection & Interactive Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (videoRef.current && isCameraActive && isModelReady) {
        const detectedHands = detectHands(videoRef.current, timestamp);
        setAllHandsLandmarks(detectedHands);

        const evalState = evaluateGestures(detectedHands);
        setActiveGesture(evalState.gesture);

        // -------------------------------------------------------------
        // 1. Touchless Virtual Hover-Dwell Cursor Navigation
        // -------------------------------------------------------------
        if (evalState.indexFingerTip) {
          // Convert mirrored normalized coords to screen pixels
          const rawScreenX = (1 - evalState.indexFingerTip.x) * window.innerWidth;
          const rawScreenY = evalState.indexFingerTip.y * window.innerHeight;

          // Low-pass coordinate smoothing for cursor
          const prev = prevCursorPosRef.current || { x: rawScreenX, y: rawScreenY };
          const smoothX = prev.x + (rawScreenX - prev.x) * 0.45;
          const smoothY = prev.y + (rawScreenY - prev.y) * 0.45;
          prevCursorPosRef.current = { x: smoothX, y: smoothY };

          // Hit test against interactive touchless targets
          const touchlessElements = document.querySelectorAll('[data-touchless-id]');
          let foundTargetId: string | null = null;

          touchlessElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (
              smoothX >= rect.left &&
              smoothX <= rect.right &&
              smoothY >= rect.top &&
              smoothY <= rect.bottom
            ) {
              foundTargetId = el.getAttribute('data-touchless-id');
            }
          });

          // Dwell progress calculation
          let dwellProg = 0;
          const now = performance.now();

          if (foundTargetId) {
            if (currentHoverIdRef.current === foundTargetId) {
              const elapsed = now - (hoverStartTimeRef.current || now);
              dwellProg = Math.min(1, elapsed / DWELL_TRIGGER_DURATION_MS);

              // 100% Dwell reached -> trigger action
              if (dwellProg >= 1 && lastDwellTriggeredIdRef.current !== foundTargetId) {
                lastDwellTriggeredIdRef.current = foundTargetId;
                handleDwellSelect(foundTargetId);
              }
            } else {
              currentHoverIdRef.current = foundTargetId;
              hoverStartTimeRef.current = now;
              lastDwellTriggeredIdRef.current = null;
            }
          } else {
            currentHoverIdRef.current = null;
            hoverStartTimeRef.current = null;
            lastDwellTriggeredIdRef.current = null;
          }

          setVirtualCursor({
            x: smoothX,
            y: smoothY,
            isActive: true,
            hoveredTargetId: foundTargetId,
            dwellProgress: dwellProg,
          });
        } else {
          setVirtualCursor((c) => ({ ...c, isActive: false, dwellProgress: 0 }));
          prevCursorPosRef.current = null;
          currentHoverIdRef.current = null;
          hoverStartTimeRef.current = null;
        }

        // -------------------------------------------------------------
        // 2. Two-Stage Framing & Capture Workflow
        // -------------------------------------------------------------
        if (stageRef.current === 'IDLE' || stageRef.current === 'FRAMING') {
          if (evalState.gesture === 'FRAME_CAPTURE' && evalState.frameBox) {
            const smoothed = smoothBoundingBox(evalState.frameBox, prevFrameBoxRef.current);
            prevFrameBoxRef.current = smoothed;
            setFrameBox(smoothed);

            if (stageRef.current === 'IDLE') {
              setStage('FRAMING');
              lockHoldStartRef.current = performance.now();
            }

            const now = performance.now();
            const elapsed = now - (lockHoldStartRef.current || now);
            const progress = Math.min(1, elapsed / LOCK_HOLD_DURATION_MS);
            setLockProgress(progress);

            // Stage 1 Complete: 2.0s hold reached -> Lock permanently & start Stage 2
            if (elapsed >= LOCK_HOLD_DURATION_MS) {
              lockedFrameBoxRef.current = smoothed;
              playFrameLock();
              startFreePoseCountdown();
            }
          } else {
            // Cancel framing if hands broken before 2.0s
            if (stageRef.current === 'FRAMING') {
              setStage('IDLE');
              setLockProgress(0);
              lockHoldStartRef.current = null;
              prevFrameBoxRef.current = null;
              setFrameBox(null);
            }
          }
        }

        // -------------------------------------------------------------
        // 3. Smooth Air Drawing (when not hovering UI targets)
        // -------------------------------------------------------------
        if (
          evalState.gesture === 'AIR_DRAW' &&
          evalState.drawPoint &&
          !currentHoverIdRef.current &&
          stageRef.current !== 'LOCKED_COUNTDOWN'
        ) {
          const smoothedPt = smoothPoint(evalState.drawPoint, prevDrawPointRef.current);
          prevDrawPointRef.current = smoothedPt;

          const newPoint: DrawingPoint = {
            x: smoothedPt.x,
            y: smoothedPt.y,
            color: selectedColor,
            size: brushSize,
          };

          setCurrentStroke((prev) => [...prev, newPoint]);
        } else {
          // Commit stroke to permanent array when pointing ceases
          if (currentStroke.length > 0) {
            setStrokes((prev) => [
              ...prev,
              {
                points: currentStroke,
                color: selectedColor,
                size: brushSize,
              },
            ]);
            setCurrentStroke([]);
          }
          prevDrawPointRef.current = null;
        }

        // -------------------------------------------------------------
        // 4. Open Palm (Wipe / Reset Canvas & Framing)
        // -------------------------------------------------------------
        if (evalState.gesture === 'OPEN_PALM') {
          const now = Date.now();
          if (now - palmCooldownRef.current > 1500) {
            if (strokes.length > 0 || currentStroke.length > 0) {
              handleClearDrawing();
              palmCooldownRef.current = now;
            }
            // If in framing, cancel frame lock
            if (stageRef.current === 'FRAMING' || stageRef.current === 'LOCKED_COUNTDOWN') {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setStage('IDLE');
              setFrameBox(null);
              setCountdown(null);
              setLockProgress(0);
              lockedFrameBoxRef.current = null;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isCameraActive,
    isModelReady,
    detectHands,
    videoRef,
    selectedColor,
    brushSize,
    currentStroke,
    strokes.length,
    handleDwellSelect,
    startFreePoseCountdown,
    handleClearDrawing,
    playFrameLock,
  ]);

  // Keyboard Shortcuts (Space to capture, C to clear, G for guide)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleManualCapture();
      } else if (e.code === 'KeyC') {
        handleClearDrawing();
      } else if (e.code === 'KeyG') {
        setIsGuideOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualCapture, handleClearDrawing]);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans">
      {/* Top Glassmorphism HUD with Touchless Dwell Targets */}
      <ControlHeader
        fps={fps}
        activeGesture={activeGesture}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        selectedFrameId={selectedFrameId}
        onSelectFrame={setSelectedFrameId}
        brushSize={brushSize}
        onChangeBrushSize={setBrushSize}
        availableCameras={availableCameras}
        selectedCameraId={selectedCameraId}
        onSelectCamera={switchCamera}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClearDrawing={handleClearDrawing}
        onOpenGuide={() => setIsGuideOpen(true)}
        onManualCapture={handleManualCapture}
        hoveredTargetId={virtualCursor.hoveredTargetId}
      />

      {/* Main Multi-Layer Camera & Canvas View */}
      <CameraView
        videoRef={videoRef}
        isCameraActive={isCameraActive}
        frameBox={frameBox}
        allHands={allHandsLandmarks}
        activeGesture={activeGesture}
        stage={stage}
        countdown={countdown}
        lockProgress={lockProgress}
        isFlashing={isFlashing}
        strokes={strokes}
        currentStroke={currentStroke}
        selectedColor={selectedColor}
        brushSize={brushSize}
        selectedFrameId={selectedFrameId}
        videoDimensions={videoDimensions}
        virtualCursor={virtualCursor}
      />

      {/* Loading & Camera Error Overlay */}
      {(!isCameraActive || isLoading) && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 text-center text-white">
          {errorMessage ? (
            <div className="max-w-md p-6 rounded-3xl bg-red-950/40 border border-red-500/50 shadow-2xl flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-3 animate-bounce" />
              <h2 className="text-lg font-bold text-white mb-2">Akses Kamera Diperlukan</h2>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Hubungkan Kamera Lagi</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-neon-cyan/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-t-neon-cyan border-r-neon-pink border-b-neon-gold border-l-transparent animate-spin" />
                <Camera className="absolute w-7 h-7 text-neon-cyan" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">
                Menginisialisasi MediaPipe AI...
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Memuat akselerasi GPU & model Hand Landmarker lokal offline untuk performa maksimal di Mac M4.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Touchless Status Hint */}
      <footer className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md text-xs text-slate-300 shadow-glass">
          <div className="flex items-center gap-1.5 text-neon-cyan font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alur Dua Tahap:</span>
          </div>
          <span className="hidden sm:inline">
            1. Bentuk bingkai <strong>2 tangan</strong> (tahan 2s) untuk kunci area fokus • 2. Berpose bebas saat <strong>countdown 3s</strong> berputar!
          </span>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="text-neon-cyan hover:underline font-bold text-xs"
          >
            Panduan Lengkap
          </button>
        </div>
      </footer>

      {/* Captured Photo Preview Modal */}
      <PhotoPreviewModal
        photo={capturedPhoto}
        onClose={() => {
          setCapturedPhoto(null);
          setStage('IDLE');
        }}
      />

      {/* Gesture Help Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </main>
  );
}
