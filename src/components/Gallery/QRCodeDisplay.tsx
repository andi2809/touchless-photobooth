'use client';

import React from 'react';

interface QRCodeDisplayProps {
  url?: string;
  imageSrc?: string;
  size?: number;
  className?: string;
  showDoodleFrame?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  imageSrc = '/assets/qr/qr-ptik-photobooth.png',
  size = 110,
  className = '',
  showDoodleFrame = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Optional Doodle Frame Overlay */}
      {showDoodleFrame && (
        <div className="absolute -inset-3 pointer-events-none z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/qr/qr_frame_doodle.png"
            alt="Frame"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* QR Box */}
      <div
        style={{ width: size, height: size }}
        className="p-2 bg-white rounded-2xl shadow-md inline-flex items-center justify-center overflow-hidden border-2 border-slate-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="QR Code PTIK Photobooth"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

