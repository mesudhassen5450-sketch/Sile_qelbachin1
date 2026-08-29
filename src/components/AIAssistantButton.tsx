/**
 * Floating AI Assistant Button
 * Bottom-right corner with black circle and red AI icon
 */

'use client';

import React from 'react';
import { AIIconAnimated } from './AIIcon';

interface AIAssistantButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function AIAssistantButton({ onClick, isOpen }: AIAssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full
        bg-black
        shadow-2xl
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-110 hover:shadow-red-900/50
        active:scale-95
        group
        ${isOpen ? 'scale-95 shadow-red-900/40' : ''}
      `}
      aria-label="Open Islamic Knowledge Assistant"
      title="Islamic Knowledge Assistant"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
      
      {/* Icon */}
      <div className={`relative transition-transform duration-300 ${isOpen ? 'rotate-0' : 'group-hover:scale-110'}`}>
        {!isOpen ? (
          <AIIconAnimated size={28} className="sm:w-8 sm:h-8" />
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-red-600 sm:w-8 sm:h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>

      {/* Notification badge (optional - can be used for updates) */}
      {!isOpen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black animate-pulse" />
      )}
    </button>
  );
}

/**
 * AI Button with tooltip
 */
export function AIAssistantButtonWithTooltip({ onClick, isOpen }: AIAssistantButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    // Show tooltip after 3 seconds on first visit
    const hasSeenTooltip = localStorage.getItem('ai-assistant-tooltip-seen');
    if (!hasSeenTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('ai-assistant-tooltip-seen', 'true');
        }, 5000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-64 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black text-white text-sm p-4 rounded-2xl shadow-2xl border border-red-900/30">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-lg flex-shrink-0">💬</span>
              <div>
                <p className="font-semibold mb-1">ስለ ቀልባችን Assistant</p>
                <p className="text-neutral-300 text-xs">
                  Ask me about Kitabs, audio lectures, and Islamic content!
                </p>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black border-r border-b border-red-900/30 transform rotate-45" />
          </div>
        </div>
      )}

      {/* Button */}
      <AIAssistantButton onClick={onClick} isOpen={isOpen} />
    </div>
  );
}
