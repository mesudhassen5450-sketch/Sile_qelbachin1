import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarqueeBanner from '@/components/MarqueeBanner';
import { AudioProvider } from '@/context/AudioContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import ThemeProvider from '@/components/ThemeProvider';
import GoogleTranslate from '@/components/GoogleTranslate';
import AIAssistant from '@/components/AIAssistant';
import AIErrorBoundary from '@/components/AIErrorBoundary';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import SiteJsonLd from '@/components/SiteJsonLd';
import PageSeo from '@/components/PageSeo';
import { SITE_URL } from '@/data/channelData';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ስለ ቀልባችን — Islamic Educational Channel',
    template: '%s | ስለ ቀልባችን',
  },
  description:
    'ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ የምንፈልግበት የእስልምና ትምህርታዊ መድረክ። Kitab, audio ders, muhadara, and reminders from Sle Qelbachin.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'am_ET',
    url: SITE_URL,
    siteName: 'ስለ ቀልባችን',
    title: 'ስለ ቀልባችን — Islamic Educational Channel',
    description:
      'Islamic educational platform with kitab collections, audio lessons, muhadara, and daily reminders.',
    images: [{ url: '/logo.jpg', alt: 'ስለ ቀልባችን' }],
  },
  twitter: {
    card: 'summary',
    title: 'ስለ ቀልባችን — Islamic Educational Channel',
    description: 'Kitab, audio ders, muhadara, and reminders from Sle Qelbachin.',
    images: ['/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="am" dir="ltr" className="dark notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen flex flex-col antialiased notranslate">
        <SiteJsonLd />
        <ThemeProvider>
          <LanguageProvider>
            <AudioProvider>
              <div className="flex flex-col min-h-screen">
                <div className="fixed top-0 left-0 right-0 z-40">
                  <Navbar />
                  <MarqueeBanner />
                </div>
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full pb-28 pt-[calc(var(--site-header-height)+2.5rem)]">
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
            </AudioProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}