'use client';

import React, { useEffect, useRef } from 'react';
import { DrawingStroke, DrawingPoint } from '@/types/photobooth';
import { drawNeonStroke } from '@/utils/canvasRenderer';

interface AirCanvasProps {
  strokes: DrawingStroke[];
  currentStroke: DrawingPoint[];
  selectedColor: string;
  brushSize: number;
  width: number;
  height: number;
  isMirrored?: boolean;
}

export const NEON_COLORS = [
  { id: 'color-cyan', name: 'Cyan', hex: '#00f0ff', glow: 'rgba(0, 240, 255, 0.8)', bgClass: 'bg-[#00f0ff]' },
  { id: 'color-magenta', name: 'Magenta', hex: '#ff007f', glow: 'rgba(255, 0, 127, 0.8)', bgClass: 'bg-[#ff007f]' },
  { id: 'color-gold', name: 'Gold', hex: '#ffe600', glow: 'rgba(255, 230, 0, 0.8)', bgClass: 'bg-[#ffe600]' },
  { id: 'color-lime', name: 'Lime', hex: '#00ff66', glow: 'rgba(0, 255, 102, 0.8)', bgClass: 'bg-[#00ff66]' },
  { id: 'color-purple', name: 'Purple', hex: '#b026ff', glow: 'rgba(176, 38, 255, 0.8)', bgClass: 'bg-[#b026ff]' },
  { id: 'color-white', name: 'White', hex: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)', bgClass: 'bg-white' },
];

export const AirCanvas: React.FC<AirCanvasProps> = ({
  strokes,
  currentStroke,
  selectedColor,
  brushSize,
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

    // 1. Draw all completed strokes
    strokes.forEach((stroke) => {
      drawNeonStroke(ctx, stroke, isMirrored, canvas.width, canvas.height);
    });

    // 2. Draw live active stroke currently being traced in the air
    if (currentStroke && currentStroke.length > 0) {
      drawNeonStroke(
        ctx,
        {
          points: currentStroke,
          color: selectedColor,
          size: brushSize,
        },
        isMirrored,
        canvas.width,
        canvas.height
      );
    }
  }, [strokes, currentStroke, selectedColor, brushSize, width, height, isMirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};
