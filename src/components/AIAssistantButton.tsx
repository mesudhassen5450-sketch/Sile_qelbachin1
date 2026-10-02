/**
 * Floating AI Assistant Button
 * First visit: brief labeled pill, then icon-only circle forever.
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

const LABEL_KEY = 'ai-fab-label-seen';

export default function AIAssistantButton({ onClick, isOpen }: AIAssistantButtonProps) {
  const { t } = useLanguage();
  const { currentTrack } = useAudio();
  const [showLabel, setShowLabel] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(LABEL_KEY)) return;
      setShowLabel(true);
      const hide = window.setTimeout(() => {
        setShowLabel(false);
        localStorage.setItem(LABEL_KEY, '1');
      }, 4500);
      return () => window.clearTimeout(hide);
    } catch {
      /* ignore */
    }
  }, []);

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        fixed z-50
        ${currentTrack ? 'bottom-28 sm:bottom-24' : 'bottom-5'}
        right-4
        rounded-full
        bg-black
        text-white
        border border-red-700/70
        shadow-2xl
        flex items-center
        transition-all duration-300 ease-out
        hover:scale-[1.04] hover:shadow-red-900/50
        active:scale-95
        ${showLabel ? 'pl-1.5 pr-3.5 py-1.5 gap-2 max-w-[calc(100vw-2rem)]' : 'p-0'}
      `}
      aria-label={t('ai.askButton')}
      title={t('ai.askButton')}
    >
      <span className="relative w-12 h-12 rounded-full bg-neutral-950 border border-red-700/40 flex items-center justify-center flex-shrink-0">
        <AIIconAnimated size={26} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black animate-pulse" />
      </span>
      {showLabel ? (
        <span className="text-sm font-semibold leading-tight text-left pr-0.5 whitespace-nowrap">
          {t('ai.askButton')}
        </span>
      ) : null}
    </button>
  );
}

/** AI button — first-visit tip bubble, then circle-only FAB. */
export function AIAssistantButtonWithTooltip({ onClick, isOpen }: AIAssistantButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    try {
      const hasSeenTooltip = localStorage.getItem('ai-assistant-tooltip-seen');
      if (!hasSeenTooltip) {
        const timer = window.setTimeout(() => {
          setShowTooltip(true);
          window.setTimeout(() => {
            setShowTooltip(false);
            localStorage.setItem('ai-assistant-tooltip-seen', 'true');
          }, 4000);
        }, 2500);
        return () => window.clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (isOpen) return null;

  return (
    <>
      {showTooltip ? (
        <div className="fixed bottom-24 right-4 z-50 w-56 pointer-events-none animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-black text-white text-sm p-3 rounded-2xl shadow-2xl border border-red-900/30">
            <p className="font-semibold mb-0.5">{t('ai.title')}</p>
            <p className="text-neutral-300 text-xs leading-snug">{t('ai.empty')}</p>
          </div>
        </div>
      ) : null}
      <AIAssistantButton onClick={onClick} isOpen={isOpen} />
    </>
  );
}
