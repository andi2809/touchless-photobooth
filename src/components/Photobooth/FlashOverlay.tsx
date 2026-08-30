'use client';

import React from 'react';

interface FlashOverlayProps {
  isFlashing: boolean;
}

export const FlashOverlay: React.FC<FlashOverlayProps> = ({ isFlashing }) => {
  if (!isFlashing) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 bg-white animate-shutter-flash" />
  );
};
