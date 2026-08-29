import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AudioProvider } from '@/context/AudioContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import ThemeProvider from '@/components/ThemeProvider';
import GoogleTranslate from '@/components/GoogleTranslate';
import AIAssistant from '@/components/AIAssistant';
import AIErrorBoundary from '@/components/AIErrorBoundary';

export const metadata: Metadata = {
  title: 'ስለ ቀልባችን - Islamic Educational Channel',
  description: 'ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ የምንፈልግበት የእስልምና ትምህርታዊ መድረክ።',
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
        <ThemeProvider>
          <LanguageProvider>
            <AudioProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full pt-24 pb-28">
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