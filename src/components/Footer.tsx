'use client';

import Link from 'next/link';
import Image from 'next/image';
import { siteMetadata } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { Send, Video, BookOpen, Headphones, ShieldCheck, Heart, Sparkles, Youtube } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800 transition-colors pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-neutral-800">
          
          {/* Channel Info & Purpose */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/40">
                <Image
                  src="/logo.jpg"
                  alt={siteMetadata.channelName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {siteMetadata.channelName}
                </h3>
                <p className="text-xs text-red-400 font-mono">የቀልብና የኢማን ማጠናከሪያ ቻናል</p>
              </div>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed max-w-lg">
              በዚህ የፈተናና የቴክኖሎጂ ዘመን ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ የምንፈልግበትና ለወጣቱ ትውልድ በራሱ ቋንቋ የሕይወት መፍትሔዎችን የምናመላክትበት የእስልምና ትምህርታዊ መድረክ።
            </p>

            {/* Social Verification Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/50 text-sky-300 text-xs hover:bg-sky-900 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram: {siteMetadata.telegramHandle}</span>
              </a>

              <a
                href="https://youtube.com/@sle_qelbachn1?si=jwFjYSDtGE-clwJn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-xs hover:bg-red-900 transition"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube: @sle_qelbachn1</span>
              </a>

              <a
                href={siteMetadata.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs hover:bg-neutral-700 transition"
              >
                <Video className="w-3.5 h-3.5" />
                <span>TikTok: {siteMetadata.tiktokHandle}</span>
              </a>
            </div>
          </div>

          {/* Quick Subpages Grid */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {t('nav.subpages')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/reminders" className="hover:text-red-400 transition flex items-center space-x-2">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.reminders')}</span>
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="hover:text-red-400 transition flex items-center space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.knowledge')}</span>
                </Link>
              </li>
              <li>
                <Link href="/sahabah" className="hover:text-red-400 transition flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.sahabah')}</span>
                </Link>
              </li>
              <li>
                <Link href="/muhadara" className="hover:text-red-400 transition flex items-center space-x-2">
                  <Headphones className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.muhadara')}</span>
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-red-400 transition flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>{t('nav.videos')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Main Nav Items */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              ዋና ገጾች (Main Navigation)
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">{t('nav.home')}</Link>
              </li>
              <li>
                <Link href="/kitab" className="hover:text-white transition">{t('nav.kitab')}</Link>
              </li>
              <li>
                <Link href="/audio-lecture" className="hover:text-white transition">{t('nav.audioLecture')}</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">{t('nav.contact')}</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} {siteMetadata.channelName} — {t('rightsReserved')}</p>
          <p className="flex items-center space-x-1">
            <span>በአላህ ፈቃድ ለቀልብ ጥራት የቀረበ መድረክ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}