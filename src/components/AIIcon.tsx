/**
 * AI Assistant Icon - Red speech bubble on black background
 * Custom design matching Sle Qelbachin brand colors
 */

import React from 'react';

interface AIIconProps {
  size?: number;
  className?: string;
}

export default function AIIcon({ size = 24, className = '' }: AIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Islamic Knowledge Assistant"
    >
      {/* Background speech bubble - Black */}
      <path
        d="M20 6H8C6.895 6 6 6.895 6 8V16C6 17.105 6.895 18 8 18H10V22L14 18H20C21.105 18 22 17.105 22 16V8C22 6.895 21.105 6 20 6Z"
        fill="#000000"
        opacity="0.5"
      />
      
      {/* Foreground speech bubble - Red */}
      <path
        d="M24 10H12C10.895 10 10 10.895 10 12V20C10 21.105 10.895 22 12 22H14V26L18 22H24C25.105 22 26 21.105 26 20V12C26 10.895 25.105 10 24 10Z"
        fill="#DC2626"
      />
      
      {/* Question mark symbol - White */}
      <g fill="#FFFFFF">
        <path d="M18 13.5C18.828 13.5 19.5 14.172 19.5 15C19.5 15.5 19.25 15.95 18.875 16.225C18.5 16.5 18 16.875 18 17.5V18" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              fill="none"/>
        <circle cx="18" cy="19.5" r="0.75" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}

/**
 * Animated AI Icon with pulse effect
 */
export function AIIconAnimated({ size = 24, className = '' }: AIIconProps) {
  return (
    <div className="relative inline-block">
      {/* Pulse ring animation */}
      <div className="absolute inset-0 animate-ping opacity-20">
        <div className="w-full h-full rounded-full bg-red-600" />
      </div>
      
      {/* Main icon */}
      <AIIcon size={size} className={className} />
    </div>
  );
}

/**
 * AI Logo for chat header - larger version
 */
export function AILogo({ size = 40 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-full opacity-10 blur-xl" />
      <AIIcon size={size} className="relative z-10" />
    </div>
  );
}
