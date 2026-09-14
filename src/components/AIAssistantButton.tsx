/**
 * Floating AI Assistant Button
 * Persistent labeled pill: "Ask Sile Qelbachin AI"
 */

'use client';

import React from 'react';
import { AIIconAnimated } from './AIIcon';
import { useLanguage } from '@/context/LanguageContext';
import { useAudio } from '@/context/AudioContext';

interface AIAssistantButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function AIAssistantButton({ onClick, isOpen }: AIAssistantButtonProps) {
  const { t } = useLanguage();
  const { currentTrack } = useAudio();

  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50
        ${currentTrack ? 'bottom-28 sm:bottom-24' : 'bottom-5'}
        right-4
        max-w-[calc(100vw-2rem)]
        pl-1.5 pr-4 py-1.5
        rounded-full
        bg-black
        text-white
        border border-red-700/70
        shadow-2xl
        flex items-center gap-2.5
        transition-all duration-300 ease-out
        hover:scale-[1.03] hover:shadow-red-900/50
        active:scale-95
        group
      `}
      aria-label={t('ai.askButton')}
      title={t('ai.askButton')}
    >
      <span className="relative w-11 h-11 rounded-full bg-neutral-950 border border-red-700/40 flex items-center justify-center flex-shrink-0">
        <AIIconAnimated size={26} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black animate-pulse" />
      </span>
      <span className="text-sm font-semibold leading-tight text-left pr-1">
        {t('ai.askButton')}
      </span>
    </button>
  );
}

/**
 * AI Button with tooltip
 */
export function AIAssistantButtonWithTooltip({ onClick, isOpen }: AIAssistantButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
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
    <div className={`fixed z-50 ${isOpen ? 'hidden' : ''}`}>
      {showTooltip && !isOpen && (
        <div className="fixed bottom-24 right-4 w-64 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black text-white text-sm p-4 rounded-2xl shadow-2xl border border-red-900/30">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-lg flex-shrink-0">💬</span>
              <div>
                <p className="font-semibold mb-1">{t('ai.title')}</p>
                <p className="text-neutral-300 text-xs">
                  {t('ai.empty')}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black border-r border-b border-red-900/30 transform rotate-45" />
          </div>
        </div>
      )}

      <AIAssistantButton onClick={onClick} isOpen={isOpen} />
    </div>
  );
}
