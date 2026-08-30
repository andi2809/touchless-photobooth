import React from 'react';

interface GestureBadgeProps {
  iconSrc: string;
  gestureName: string;
  actionText: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GestureBadge: React.FC<GestureBadgeProps> = ({
  iconSrc,
  gestureName,
  actionText,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-white/95 text-slate-900 border-amber-300 shadow-[0_8px_0_#f59e0b]',
    secondary: 'bg-slate-900/90 text-white border-slate-700 shadow-[0_8px_0_#334155]',
    accent: 'bg-pink-500 text-white border-pink-300 shadow-[0_8px_0_#be185d]',
    warning: 'bg-yellow-400 text-slate-950 border-yellow-200 shadow-[0_8px_0_#d97706]',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-2',
    md: 'px-4 py-2.5 text-sm gap-3',
    lg: 'px-6 py-3.5 text-base gap-4',
  }[size];

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-2xl border-2 font-bold backdrop-blur-md transition-transform transform hover:scale-105 select-none ${variantStyles} ${sizeStyles} ${className}`}
    >
      <div className={`relative shrink-0 flex items-center justify-center ${iconSizes}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt={gestureName}
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[11px] uppercase tracking-wider opacity-75 leading-tight">
          {gestureName}
        </span>
        <span className="font-extrabold tracking-tight leading-tight">{actionText}</span>
      </div>
    </div>
  );
};
