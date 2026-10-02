'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import VideoArchiveGrid from '@/components/VideoArchiveGrid'

/**
 * /videos — one system:
 * horizontal chooser (long → short) + scrollable player with ↑↓ arrows.
 * ?play=id focuses that video in the feed.
 */
function VideosBody() {
  const searchParams = useSearchParams()
  const playId = searchParams.get('play')
  const feedMode = searchParams.get('feed') === '1'

  return <VideoArchiveGrid focusId={playId} feedOnly={feedMode || Boolean(playId)} />
}

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
          Loading videos…
        </div>
      }
    >
      <VideosBody />
    </Suspense>
  )
}
