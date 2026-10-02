'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Intro recitation video was removed from site start.
 * Provider kept as a no-op so layout imports stay stable.
 */
type IntroRecitationContextValue = {
  phase: 'done'
  isPlaying: false
}

const IntroRecitationContext = createContext<IntroRecitationContextValue>({
  phase: 'done',
  isPlaying: false,
})

export function useIntroRecitation() {
  return useContext(IntroRecitationContext)
}

export function IntroRecitationProvider({ children }: { children: ReactNode }) {
  return (
    <IntroRecitationContext.Provider value={{ phase: 'done', isPlaying: false }}>
      {children}
    </IntroRecitationContext.Provider>
  )
}
