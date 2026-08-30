'use client';

import React from 'react';
import { BlurFocusLayer } from './BlurFocusLayer';
import { AirCanvas } from './AirCanvas';
import { CountdownOverlay } from './CountdownOverlay';
import { FlashOverlay } from './FlashOverlay';
import { VirtualCursor } from './VirtualCursor';
import {
  BoundingBox,
  NormalizedLandmark,
  ActiveGesture,
  DrawingStroke,
  DrawingPoint,
  CaptureStage,
  PhotoboothFrameId,
  VirtualCursorState,
} from '@/types/photobooth';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  frameBox: BoundingBox | null;
  allHands: NormalizedLandmark[][];
  activeGesture: ActiveGesture;
  stage: CaptureStage;
  countdown: number | null;
  lockProgress: number;
  isFlashing: boolean;
  strokes: DrawingStroke[];
  currentStroke: DrawingPoint[];
  selectedColor: string;
  brushSize: number;
  selectedFrameId: PhotoboothFrameId;
  videoDimensions: { width: number; height: number };
  virtualCursor: VirtualCursorState;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  isCameraActive,
  frameBox,
  allHands,
  activeGesture,
  stage,
  countdown,
  lockProgress,
  isFlashing,
  strokes,
  currentStroke,
  selectedColor,
  brushSize,
  selectedFrameId,
  videoDimensions,
  virtualCursor,
}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Video & Multi-Layer Stacking */}
      <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
        {/* 1. Base Mirrored Webcam Video Stream */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 2. Blur & Focus "Foto Kita Blur" Layer + Skeleton Overlay */}
        <BlurFocusLayer
          videoElement={videoRef.current}
          frameBox={frameBox}
          allHands={allHands}
          activeGesture={activeGesture}
          stage={stage}
          lockProgress={lockProgress}
          width={videoDimensions.width}
          height={videoDimensions.height}
          isMirrored={true}
        />

        {/* 3. Live Selected Frame Overlay (Cyber / Retro / Comic) */}
        {selectedFrameId && selectedFrameId !== 'none' && (
          <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/frames/frame-${selectedFrameId}.svg`}
              alt="Live Frame Overlay"
              className="w-full h-full object-fill pointer-events-none"
            />
          </div>
        )}

        {/* 4. Neon Air Drawing Canvas */}
        <AirCanvas
          strokes={strokes}
          currentStroke={currentStroke}
          selectedColor={selectedColor}
          brushSize={brushSize}
          width={videoDimensions.width}
          height={videoDimensions.height}
          isMirrored={true}
        />

        {/* 5. Center Two-Stage Free Pose Countdown HUD */}
        <CountdownOverlay countdown={countdown} stage={stage} />

        {/* 6. Shutter White Flash Screen */}
        <FlashOverlay isFlashing={isFlashing} />

        {/* 7. Virtual Hover-Dwell Cursor for Touchless Navigation */}
        <VirtualCursor cursor={virtualCursor} />
      </div>
    </div>
  );
};
