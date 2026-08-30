'use client';

import React from 'react';
import { VirtualCursorState } from '@/types/photobooth';

interface VirtualCursorProps {
  cursor: VirtualCursorState;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ cursor }) => {
  if (!cursor.isActive) return null;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - cursor.dwellProgress * circumference;

  return (
    <div
      className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
      }}
    >
      {/* Outer SVG Dwell Progress Ring */}
      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 52 52">
        {/* Background Track */}
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="rgba(0, 0, 0, 0.4)"
          stroke={cursor.hoveredTargetId ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}
          strokeWidth="3.5"
        />

        {/* Active Dwell Progress Arc */}
        {cursor.dwellProgress > 0 && (
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke={cursor.dwellProgress >= 1 ? '#00ff66' : '#00f0ff'}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75 ease-linear filter drop-shadow-[0_0_8px_#00f0ff]"
          />
        )}
      </svg>

      {/* Center Target Dot & Reticle Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
            cursor.hoveredTargetId
              ? 'bg-neon-cyan scale-125 shadow-[0_0_12px_#00f0ff]'
              : 'bg-white/90 scale-100 shadow-[0_0_6px_#ffffff]'
          }`}
        />
      </div>

      {/* Dwell Label Tag */}
      {cursor.hoveredTargetId && cursor.dwellProgress > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/80 border border-neon-cyan/50 text-[10px] font-mono text-neon-cyan whitespace-nowrap backdrop-blur-sm">
          {Math.round(cursor.dwellProgress * 100)}%
        </div>
      )}
    </div>
  );
};
