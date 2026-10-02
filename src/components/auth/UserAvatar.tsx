'use client'

/**
 * Google / auth avatar — use plain <img> with no-referrer so Google profile
 * photos load reliably (next/image often fails on googleusercontent).
 */
export default function UserAvatar({
  url,
  name,
  size = 36,
  className = '',
}: {
  url: string | null | undefined
  name?: string | null
  size?: number
  className?: string
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-red-600 text-white font-bold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={e => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <span aria-hidden={!url}>{initial}</span>
    </span>
  )
}
