'use client';

import React, { useEffect, useRef } from 'react';
import { NormalizedLandmark } from '@/types/photobooth';

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky finger
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm webbing connections
  [5, 9], [9, 13], [13, 17]
];

interface SmoothedHand {
  landmarks: NormalizedLandmark[];
  lastSeen: number;
  opacity: number;
}

interface HandLandmarkCanvasProps {
  landmarksRef: React.RefObject<NormalizedLandmark[][]>;
  activeGestureRef?: React.RefObject<string>;
  isMirrored?: boolean;
  isVisible?: boolean;
}

export const HandLandmarkCanvas: React.FC<HandLandmarkCanvasProps> = ({
  landmarksRef,
  activeGestureRef,
  isMirrored = true,
  isVisible = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedHandsRef = useRef<SmoothedHand[]>([]);
  const lastRenderTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(100, time - lastRenderTimeRef.current);
      lastRenderTimeRef.current = time;

      // Adjust canvas resolution to match display size
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!isVisible) {
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      const width = rect.width;
      const height = rect.height;
      const now = performance.now();
      const alpha = 0.65; // Temporal Lerp smoothing factor

      const allHands = landmarksRef.current || [];
      const activeGesture = activeGestureRef?.current || 'IDLE';

      // 1. Update smoothed hands buffer with incoming detections & temporal grace period
      if (allHands.length > 0) {
        const updatedSmoothed: SmoothedHand[] = [];

        allHands.forEach((incomingHand, handIdx) => {
          if (!incomingHand || incomingHand.length < 21) return;

          const existing = smoothedHandsRef.current[handIdx];

          if (existing && existing.landmarks.length === 21) {
            // Apply Exponential Moving Average (Lerp) to each landmark
            const smoothedPts: NormalizedLandmark[] = incomingHand.map((pt, ptIdx) => {
              const prev = existing.landmarks[ptIdx];
              return {
                x: prev.x + (pt.x - prev.x) * alpha,
                y: prev.y + (pt.y - prev.y) * alpha,
                z: (prev.z ?? 0) + ((pt.z ?? 0) - (prev.z ?? 0)) * alpha,
                visibility: pt.visibility ?? 0.95,
              };
            });

            updatedSmoothed.push({
              landmarks: smoothedPts,
              lastSeen: now,
              opacity: Math.min(1, existing.opacity + 0.2),
            });
          } else {
            // New hand detected
            updatedSmoothed.push({
              landmarks: incomingHand,
              lastSeen: now,
              opacity: 0.85,
            });
          }
        });

        smoothedHandsRef.current = updatedSmoothed;
      } else {
        // No hand detected on this specific frame: apply graceful persistence decay (160ms)
        smoothedHandsRef.current = smoothedHandsRef.current
          .map((h) => {
            const age = now - h.lastSeen;
            if (age < 160) {
              return {
                ...h,
                opacity: Math.max(0, h.opacity - dt / 160),
              };
            }
            return null;
          })
          .filter((h): h is SmoothedHand => h !== null && h.opacity > 0.05);
      }

      // 2. Render all smoothed hands
      const mapX = (x: number) => (isMirrored ? (1 - x) * width : x * width);
      const mapY = (y: number) => y * height;

      smoothedHandsRef.current.forEach((smoothed, handIndex) => {
        const hand = smoothed.landmarks;
        const opacity = smoothed.opacity;
        if (!hand || hand.length < 21 || opacity <= 0) return;

        ctx.globalAlpha = opacity;

        // Dynamic theme color based on gesture
        let themeColor = '#00f0ff'; // Cyan default
        let glowColor = 'rgba(0, 240, 255, 0.85)';
        let labelText = `✋ HAND ${handIndex + 1}`;

        if (activeGesture === 'OK_SIGN') {
          themeColor = '#f59e0b'; // Amber Gold
          glowColor = 'rgba(245, 158, 11, 0.95)';
          labelText = '👌 OK SIGN (PILIH FRAME)';
        } else if (activeGesture === 'PEACE') {
          themeColor = '#10b981'; // Emerald
          glowColor = 'rgba(16, 185, 129, 0.9)';
          labelText = '✌️ PEACE (READY)';
        } else if (activeGesture === 'THUMBS_UP') {
          themeColor = '#f59e0b'; // Amber
          glowColor = 'rgba(245, 158, 11, 0.9)';
          labelText = '👍 THUMBS UP';
        } else if (activeGesture === 'THUMBS_DOWN') {
          themeColor = '#f43f5e'; // Rose Red
          glowColor = 'rgba(244, 63, 94, 0.9)';
          labelText = '👎 THUMBS DOWN (BATAL)';
        } else if (activeGesture === 'L_SIGN') {
          themeColor = '#38bdf8'; // Sky Blue
          glowColor = 'rgba(56, 189, 248, 0.9)';
          labelText = '👆 L-SIGN (PANDUAN)';
        } else if (activeGesture === 'OPEN_PALM') {
          themeColor = '#ec4899'; // Pink
          glowColor = 'rgba(236, 72, 153, 0.9)';
          labelText = '🖐️ OPEN PALM';
        } else if (activeGesture === 'SWIPE_LEFT' || activeGesture === 'SWIPE_RIGHT') {
          themeColor = '#a855f7'; // Purple
          glowColor = 'rgba(168, 85, 247, 0.9)';
          labelText = activeGesture === 'SWIPE_LEFT' ? '👈 SWIPE LEFT' : '👉 SWIPE RIGHT';
        }

        // A. Translucent Palm Webbing
        ctx.beginPath();
        ctx.moveTo(mapX(hand[0].x), mapY(hand[0].y));
        ctx.lineTo(mapX(hand[5].x), mapY(hand[5].y));
        ctx.lineTo(mapX(hand[9].x), mapY(hand[9].y));
        ctx.lineTo(mapX(hand[13].x), mapY(hand[13].y));
        ctx.lineTo(mapX(hand[17].x), mapY(hand[17].y));
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.fill();

        // B. High-Contrast Skeleton Bones
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;

        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const p1 = hand[startIdx];
          const p2 = hand[endIdx];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(mapX(p1.x), mapY(p1.y));
            ctx.lineTo(mapX(p2.x), mapY(p2.y));
            ctx.stroke();
          }
        });

        // C. All 21 Joint Dots & Glowing Fingertips
        hand.forEach((pt, idx) => {
          const x = mapX(pt.x);
          const y = mapY(pt.y);
          const isFingertip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;

          ctx.beginPath();
          if (isFingertip) {
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 12;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          } else if (idx === 0) {
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.fill();
          } else {
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fill();
          }
        });

        // D. Floating Hand Tracker Status Badge
        const topPt = hand[12] || hand[8] || hand[0];
        const tagX = mapX(topPt.x);
        const tagY = Math.max(25, mapY(topPt.y) - 24);

        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const tagText = activeGesture !== 'IDLE' ? labelText : `✋ DETECTED (${(ptConfidence(hand) * 100).toFixed(0)}%)`;
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tagX - textWidth / 2 - 8, tagY - 11, textWidth + 16, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tagText, tagX, tagY);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [landmarksRef, activeGestureRef, isMirrored, isVisible]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};

function ptConfidence(hand: NormalizedLandmark[]): number {
  if (!hand || hand.length === 0) return 0;
  const visibilities = hand.map((p) => p.visibility ?? 0.95);
  const avg = visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
  return avg;
}
