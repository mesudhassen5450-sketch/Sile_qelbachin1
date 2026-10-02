'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Interactive Day / Night switch — sliding thumb, clear day vs night.
 */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="h-9 w-[4.75rem] rounded-full bg-neutral-200/80 dark:bg-neutral-800 animate-pulse"
        aria-hidden
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to daylight mode' : 'Switch to night mode'}
      title={isDark ? 'Daylight mode' : 'Night mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="group relative inline-flex h-9 w-[4.75rem] shrink-0 items-center rounded-full border border-[#D4AF37]/50 bg-gradient-to-r from-amber-50 via-white to-[#f4ffe8] p-0.5 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:border-[#D4AF37] hover:shadow-md active:scale-[0.98] dark:border-neutral-600 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 dark:hover:border-[#D4AF37]/70"
    >
      <span className="pointer-events-none absolute inset-y-0 start-1.5 flex items-center">
        <Sun
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? 'scale-90 text-neutral-500 opacity-40' : 'scale-110 text-amber-500'
          }`}
        />
      </span>
      <span className="pointer-events-none absolute inset-y-0 end-1.5 flex items-center">
        <Moon
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? 'scale-110 text-sky-300' : 'scale-90 text-neutral-400 opacity-40'
          }`}
        />
      </span>
      <span
        className={`pointer-events-none relative z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 ease-out dark:bg-neutral-950 dark:ring-white/10 ${
          isDark ? 'ms-auto' : 'ms-0'
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-sky-300" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  )
}
