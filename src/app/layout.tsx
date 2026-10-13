import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AudioProvider } from '@/context/AudioContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { IntroRecitationProvider } from '@/context/IntroRecitationContext';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import ThemeProvider from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import GoogleTranslate from '@/components/GoogleTranslate';
import AIAssistant from '@/components/AIAssistant';
import AIErrorBoundary from '@/components/AIErrorBoundary';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import SiteJsonLd from '@/components/SiteJsonLd';
import PageSeo from '@/components/PageSeo';
import { SITE_URL } from '@/data/channelData';
import { SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ስለ ቀልባችን (Sile Qelbachin) — Islamic Website Ethiopia',
    template: '%s | Sile Qelbachin — ስለ ቀልባችን',
  },
  description:
    'Sile Qelbachin (ስለ ቀልባችን / sileqelbachin / seleqelbachin) — best Islamic educational website in Ethiopia. Qur’an, kitab, da’wah, videos, and ask an Ustaz online by Telegram or email.',
  keywords: [...SEO_KEYWORDS],
  applicationName: 'Sile Qelbachin',
  authors: [{ name: 'Sile Qelbachin', url: SITE_URL }],
  creator: 'Sile Qelbachin — ስለ ቀልባችን',
  publisher: 'Sile Qelbachin',
  category: 'religion',
  classification: 'Islamic Education',
  alternates: {
    canonical: '/',
    languages: {
      am: '/',
      en: '/',
      ar: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'am_ET',
    alternateLocale: ['en_US', 'ar'],
    url: SITE_URL,
    siteName: 'Sile Qelbachin — ስለ ቀልባችን',
    title: 'ስለ ቀልባችን (Sile Qelbachin) — Islamic Website Ethiopia',
    description:
      'Islamic educational platform in Ethiopia: Qur’an tilawah & tafsir, kitab audio ders, da’wah, videos, and ask a question online.',
    images: [{ url: '/logo.jpg', width: 512, height: 512, alt: 'Sile Qelbachin — ስለ ቀልባችን' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ስለ ቀልባችን (Sile Qelbachin) — Islamic Website Ethiopia',
    description:
      'Qur’an, kitab, da’wah, videos, and ask an Ustaz — Sile Qelbachin / sileqelbachin / seleqelbachin.',
    images: ['/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    google: 'notranslate',
  },
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am" dir="ltr" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen flex flex-col antialiased notranslate">
        <SiteJsonLd />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AudioProvider>
                <IntroRecitationProvider>
                  <div className="flex flex-col min-h-screen">
                    <div className="fixed top-0 left-0 right-0 z-40">
                      <Navbar />
                    </div>
                    <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full max-w-[100vw] overflow-x-hidden pb-28 pt-[calc(var(--site-header-height)+1.25rem)] sm:pt-[calc(var(--site-header-height)+2.5rem)]">
                      <PageSeo />
                      <AnalyticsBeacon />
                      {children}
                    </main>
                    <Footer />
                    <AudioPlayerBar />
                    <GoogleTranslate />
                    <AIErrorBoundary>
                      <AIAssistant />
                    </AIErrorBoundary>
                  </div>
                </IntroRecitationProvider>
              </AudioProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
