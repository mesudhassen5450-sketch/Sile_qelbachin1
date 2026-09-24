// React Imports
import type { ReactNode } from 'react'

// Next Imports
import type { Metadata } from 'next'
import { Geist_Mono, Noto_Sans_Ethiopic, Amiri } from 'next/font/google'

// Third-party Imports
import { NuqsAdapter } from 'nuqs/adapters/next/app'

// Component Imports
import Providers from '@/components/Providers'
import { TooltipProvider } from '@/components/ui/tooltip'

// Util Imports
import { cn } from '@/lib/utils'

// Style Imports
import './globals.css'
import ScrollToTop from '@/components/layout/ScrollToTop'

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: '--font-noto-ethiopic',
  subsets: ['ethiopic', 'latin'],
  weight: ['300', '400', '500', '600', '700']
})

const amiri = Amiri({
  variable: '--font-amiri',
  subsets: ['arabic', 'latin'],
  weight: ['400', '700']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'ስለ ቀልባችን Admin | Sile Qelbachin Admin',
  description:
    'Sile Qelbachin Admin — CMS to manage website and mobile content from a central hub.',
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'}`),
  openGraph: {
    title: 'Sile Qelbachin Admin',
    description: 'Central content admin for Sile Qelbachin website and mobile apps.',
    type: 'website',
    siteName: 'Sile Qelbachin Admin',
    url: process.env.NEXT_PUBLIC_APP_URL
  },
  twitter: {
    card: 'summary',
    title: 'Sile Qelbachin Admin',
    description: 'Central content admin for Sile Qelbachin website and mobile apps.'
  }
}

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html
      lang='en'
      className={cn(
        notoSansEthiopic.variable,
        amiri.variable,
        geistMono.variable,
        'dark flex min-h-full w-full antialiased'
      )}
      data-scroll-behavior='smooth'
      suppressHydrationWarning
    >
      <body className='flex min-h-full w-full flex-auto flex-col'>
        <NuqsAdapter>
          <Providers sidebarDefaultOpen={true}>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
        </NuqsAdapter>

        <ScrollToTop />
      </body>
    </html>
  )
}

export default RootLayout
