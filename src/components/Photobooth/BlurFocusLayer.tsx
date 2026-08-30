'use client';

import React, { useEffect, useRef } from 'react';
import { BoundingBox, NormalizedLandmark, ActiveGesture, CaptureStage } from '@/types/photobooth';
import { drawTwoStageFrameHUD, drawHandLandmarks } from '@/utils/canvasRenderer';

interface BlurFocusLayerProps {
  videoElement: HTMLVideoElement | null;
  frameBox: BoundingBox | null;
  allHands: NormalizedLandmark[][];
  activeGesture: ActiveGesture;
  stage: CaptureStage;
  lockProgress: number; // 0 to 1
  width: number;
  height: number;
  isMirrored?: boolean;
}

export const BlurFocusLayer: React.FC<BlurFocusLayerProps> = ({
  videoElement,
  frameBox,
  allHands,
  activeGesture,
  stage,
  lockProgress,
  width,
  height,
  isMirrored = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isFrameActive = (stage === 'FRAMING' || stage === 'LOCKED_COUNTDOWN') && frameBox;

    // 1. If Frame Box is active (Dynamic or Locked), apply "Foto Kita Blur" focus effect
    if (isFrameActive && videoElement && videoElement.readyState >= 2) {
      // Step A: Draw blurred background video
      ctx.save();
      ctx.filter = 'blur(18px) brightness(0.8)';
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Step B: Clip sharp focus rectangle
      const minX = isMirrored ? (1 - frameBox.maxX) * canvas.width : frameBox.minX * canvas.width;
      const minY = frameBox.minY * canvas.height;
      const boxW = frameBox.width * canvas.width;
      const boxH = frameBox.height * canvas.height;
      const cornerRadius = 14;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(minX, minY, boxW, boxH, cornerRadius);
      ctx.clip();

      // Draw sharp video inside clipping path
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.restore(); // restore clipping

      // Step C: Draw Two-Stage HUD brackets & Locking / Locked indicator
      drawTwoStageFrameHUD(
        ctx,
        frameBox,
        canvas.width,
        canvas.height,
        stage,
        lockProgress,
        isMirrored
      );
    }

    // 2. Draw Hand Landmark Skeleton dots & joints (when hands are visible)
    if (stage !== 'LOCKED_COUNTDOWN') {
      drawHandLandmarks(ctx, allHands, canvas.width, canvas.height, activeGesture, isMirrored);
    }
  }, [
    videoElement,
    frameBox,
    allHands,
    activeGesture,
    stage,
    lockProgress,
    width,
    height,
    isMirrored,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
