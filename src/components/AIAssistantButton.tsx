/**
 * Floating AI Assistant Button
 * First visit: brief labeled pill, then solid red circle only.
 */

'use client'

import React from 'react'
import AIIcon from './AIIcon'
import { useLanguage } from '@/context/LanguageContext'
import { useAudio } from '@/context/AudioContext'

interface AIAssistantButtonProps {
  onClick: () => void
  isOpen: boolean
}

const LABEL_KEY = 'ai-fab-label-seen'

export default function AIAssistantButton({ onClick, isOpen }: AIAssistantButtonProps) {
  const { t } = useLanguage()
  const { currentTrack } = useAudio()
  const [showLabel, setShowLabel] = React.useState(false)

  React.useEffect(() => {
    try {
      if (localStorage.getItem(LABEL_KEY)) return
      setShowLabel(true)
      const hide = window.setTimeout(() => {
        setShowLabel(false)
        localStorage.setItem(LABEL_KEY, '1')
      }, 4000)
      return () => window.clearTimeout(hide)
    } catch {
      /* ignore */
    }
  }, [])

  if (isOpen) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        fixed z-50
        ${currentTrack ? 'bottom-28 sm:bottom-24' : 'bottom-5'}
        right-4
        rounded-full
        bg-[#A91F24]
        text-white
        shadow-md
        flex items-center
        hover:bg-[#8F171C]
        active:scale-95
        transition-colors
        ${showLabel ? 'pl-1.5 pr-3.5 py-1.5 gap-2 max-w-[calc(100vw-2rem)]' : 'p-0'}
      `}
      aria-label={t('ai.askButton')}
      title={t('ai.askButton')}
    >
      <span className="w-12 h-12 rounded-full bg-[#A91F24] flex items-center justify-center flex-shrink-0">
        <AIIcon size={26} />
      </span>
      {showLabel ? (
        <span className="text-sm font-semibold leading-tight text-left pr-0.5 whitespace-nowrap">
          {t('ai.askButton')}
        </span>
      ) : null}
    </button>
  )
}

/** AI button — first-visit tip, then static red circle. */
export function AIAssistantButtonWithTooltip({ onClick, isOpen }: AIAssistantButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  const { t } = useLanguage()

  React.useEffect(() => {
    try {
      const hasSeenTooltip = localStorage.getItem('ai-assistant-tooltip-seen')
      if (!hasSeenTooltip) {
        const timer = window.setTimeout(() => {
          setShowTooltip(true)
          window.setTimeout(() => {
            setShowTooltip(false)
            localStorage.setItem('ai-assistant-tooltip-seen', 'true')
          }, 3500)
        }, 2000)
        return () => window.clearTimeout(timer)
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (isOpen) return null

  return (
    <>
      {showTooltip ? (
        <div className="fixed bottom-24 right-4 z-50 w-52 pointer-events-none">
          <div className="bg-[#A91F24] text-white text-sm p-3 rounded-2xl shadow-md">
            <p className="font-semibold mb-0.5">{t('ai.title')}</p>
            <p className="text-white/90 text-xs leading-snug">{t('ai.empty')}</p>
          </div>
        </div>
      ) : null}
      <AIAssistantButton onClick={onClick} isOpen={isOpen} />
    </>
  )
}
