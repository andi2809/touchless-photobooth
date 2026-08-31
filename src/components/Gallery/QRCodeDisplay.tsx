'use client';

import React from 'react';

interface QRCodeDisplayProps {
  url?: string;
  imageSrc?: string;
  size?: number;
  className?: string;
  showDoodleFrame?: boolean;
  borderClassName?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  imageSrc = '/assets/qr/qr-ptik-photobooth.png',
  size = 140,
  className = '',
  showDoodleFrame = false,
  borderClassName = 'border-2 border-slate-900',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Optional Doodle Frame Overlay */}
      {showDoodleFrame && (
        <div className="absolute -inset-4 pointer-events-none z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/qr/qr_frame_doodle.png"
            alt="Frame"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* QR Box with high contrast and clean shadow */}
      <div
        style={{ width: size, height: size }}
        className={`p-2.5 bg-white rounded-2xl sm:rounded-3xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] inline-flex items-center justify-center overflow-hidden transition-all duration-300 ${borderClassName}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="QR Code PTIK Photobooth"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
    </div>
  );
};


