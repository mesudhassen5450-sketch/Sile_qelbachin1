/**
 * Hand-coded site icons for header / footer / nav.
 * Brand red #A91F24 — geometric, no emoji.
 */

import type { SVGProps, ReactElement } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(props: IconProps) {
  const { size = 18, className = '', ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: `shrink-0 ${className}`.trim(),
    'aria-hidden': true as const,
    ...rest,
  }
}

const stroke = '#A91F24'
const fill = '#A91F24'

/** Qur’an / open mushaf */
export function IconQuran(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5C20 4.67 19.33 4 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5v-13Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 4v16" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.2 8.5h2.2M7.2 11.5h2.8" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14.6 8.5h2.2M14 11.5h2.8" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Microphone / audio lessons */
export function IconAudio(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={stroke} strokeWidth="1.6" />
      <path
        d="M5.5 11a6.5 6.5 0 0 0 13 0"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 17.5V21M9 21h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** 1-minute timer */
export function IconOneMinute(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="13" r="8" stroke={stroke} strokeWidth="1.6" />
      <path d="M12 13V8.5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13l3.2 2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 3.5h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.1" fill={fill} />
    </svg>
  )
}

/** Video / clapper */
export function IconVideo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="14" height="12" rx="2" stroke={stroke} strokeWidth="1.6" />
      <path
        d="M17 10.2 21 7.8v8.4L17 13.8V10.2Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 10.5l4 2.2-4 2.2v-4.4Z" fill={fill} />
    </svg>
  )
}

/** Library / stacked books */
export function IconLibrary(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M5 4.5h4.2a1 1 0 0 1 1 1V19.5H6a1 1 0 0 1-1-1V4.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.8 4.5H19a1 1 0 0 1 1 1V18.5a1 1 0 0 1-1 1h-4.2V4.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 6.5h4.6v13H10.2V6.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6.8 8h1.8M6.8 11h2.2" stroke={stroke} strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  )
}

/** Q&A chat bubbles */
export function IconQuestions(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4A2.5 2.5 0 0 1 13.5 13H9l-3.5 2.8V13H6.5A2.5 2.5 0 0 1 4 10.5v-4Z"
        stroke={stroke}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.5h5.5A2.5 2.5 0 0 1 18 17v.8l2.2 1.7V17h.3A1.5 1.5 0 0 0 22 15.5v-3A1.5 1.5 0 0 0 20.5 11H16"
        stroke={stroke}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="8.4" r="0.7" fill={fill} />
      <circle cx="11" cy="8.4" r="0.7" fill={fill} />
    </svg>
  )
}

/** Marriage / two rings + heart */
export function IconMarriage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="13.5" r="4.2" stroke={stroke} strokeWidth="1.55" />
      <circle cx="15" cy="13.5" r="4.2" stroke={stroke} strokeWidth="1.55" />
      <path
        d="M12 5.2c.7-1.1 2.2-1.4 3.1-.5.7.7.7 1.8 0 2.5L12 10.3 8.9 7.2c-.7-.7-.7-1.8 0-2.5.9-.9 2.4-.6 3.1.5Z"
        fill={fill}
      />
    </svg>
  )
}

/** Articles / pen on paper */
export function IconArticles(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M6 4.5h9.5A1.5 1.5 0 0 1 17 6v12.5A1.5 1.5 0 0 1 15.5 20H6A1.5 1.5 0 0 1 4.5 18.5V6A1.5 1.5 0 0 1 6 4.5Z"
        stroke={stroke}
        strokeWidth="1.55"
      />
      <path d="M7.5 8.5h7M7.5 11.5h7M7.5 14.5h4.5" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" />
      <path
        d="M15.2 16.2 19.5 11.9l1.4 1.4-4.3 4.3-1.8.4.4-1.8Z"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Ask / envelope with mark */
export function IconAsk(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke={stroke} strokeWidth="1.6" />
      <path d="M4 7.5 12 13l8-5.5" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="18.2" cy="7.2" r="3.1" fill="#7F1D1D" />
      <path
        d="M18.2 5.7c.55 0 1 .4 1 .9 0 .35-.18.62-.48.82-.28.18-.52.35-.52.68v.15"
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="18.2" cy="9.35" r="0.55" fill="#fff" />
    </svg>
  )
}

/** Home */
export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-7.8Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5v-6h5v6" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

/** Contact / phone */
export function IconContact(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M8.2 4.8c.5-.5 1.3-.5 1.8 0l1.5 1.5c.5.5.5 1.3 0 1.8l-.9.9a1.2 1.2 0 0 0 0 1.7l3.7 3.7a1.2 1.2 0 0 0 1.7 0l.9-.9c.5-.5 1.3-.5 1.8 0l1.5 1.5c.5.5.5 1.3 0 1.8l-.7.7c-.9.9-2.3 1.2-3.5.7-2.4-1-5.1-3.1-7.3-5.3-2.2-2.2-4.3-4.9-5.3-7.3-.5-1.2-.2-2.6.7-3.5l.7-.7Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Brand heart */
export function IconHeart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 20.2S4.5 15.2 4.5 9.8A3.9 3.9 0 0 1 12 7.4a3.9 3.9 0 0 1 7.5 2.4c0 5.4-7.5 10.4-7.5 10.4Z"
        fill={fill}
      />
      <path
        d="M9.2 9.1c0-.9.7-1.5 1.6-1.5"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

/** Telegram paper plane */
export function IconTelegram(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M20.6 4.4 3.8 10.8c-1.1.4-1.1 2 .1 2.3l4.2 1.1 1.6 5c.3 1 1.6 1.2 2.2.4l2.3-3.1 4.5 3.3c.8.6 2 .2 2.2-.8L21.8 5.6c.2-1.1-.9-2-1.9-1.6Z"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.2 14.1 17.5 7.8" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** YouTube play badge */
export function IconYoutube(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="6" width="19" height="12" rx="3.2" stroke={stroke} strokeWidth="1.55" />
      <path d="M10.2 9.4 15.5 12l-5.3 2.6V9.4Z" fill={fill} />
    </svg>
  )
}

/** TikTok note */
export function IconTiktok(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M14 4v9.2a3.3 3.3 0 1 1-2.4-3.2V7.2c1.7.4 3.1 1.3 4.1 2.5V4H14Z"
        stroke={stroke}
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M15.7 4c.5 2.2 2.1 3.8 4.3 4.3"
        stroke={stroke}
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  )
}

export type SiteIconName =
  | 'quran'
  | 'audio'
  | 'oneMinute'
  | 'videos'
  | 'library'
  | 'questions'
  | 'marriage'
  | 'articles'
  | 'ask'
  | 'home'
  | 'contact'
  | 'heart'
  | 'telegram'
  | 'youtube'
  | 'tiktok'

const MAP: Record<SiteIconName, (p: IconProps) => ReactElement> = {
  quran: IconQuran,
  audio: IconAudio,
  oneMinute: IconOneMinute,
  videos: IconVideo,
  library: IconLibrary,
  questions: IconQuestions,
  marriage: IconMarriage,
  articles: IconArticles,
  ask: IconAsk,
  home: IconHome,
  contact: IconContact,
  heart: IconHeart,
  telegram: IconTelegram,
  youtube: IconYoutube,
  tiktok: IconTiktok,
}

/** Resolve a nav/site icon by name */
export function SiteIcon({
  name,
  size = 18,
  className = '',
}: {
  name: SiteIconName
  size?: number
  className?: string
}) {
  const Comp = MAP[name] || IconHeart
  return <Comp size={size} className={className} />
}
