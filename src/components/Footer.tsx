'use client';

import Link from 'next/link';
import Image from 'next/image';
import { siteMetadata } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { ASK_QUESTION, NAV_SECTIONS } from '@/config/siteNav';
import { SiteIcon } from '@/components/icons/SiteIcons';

export default function Footer() {
  const { t, getLocalized } = useLanguage();

  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800 transition-colors pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-neutral-800">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/40">
                <Image src="/logo.jpg" alt={siteMetadata.channelName} fill className="object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">{siteMetadata.channelName}</h3>
                <p className="text-xs text-red-400 font-mono">{t('hero.badge')}</p>
              </div>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed max-w-lg">
              {getLocalized(siteMetadata.purposeParagraph1)}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/50 text-sky-300 text-xs hover:bg-sky-900 transition"
              >
                <SiteIcon name="telegram" size={14} />
                <span>Telegram: {siteMetadata.telegramHandle}</span>
              </a>
              <a
                href="https://youtube.com/@sle_qelbachn1?si=jwFjYSDtGE-clwJn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-xs hover:bg-red-900 transition"
              >
                <SiteIcon name="youtube" size={14} />
                <span>YouTube</span>
              </a>
              <a
                href={siteMetadata.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs hover:bg-neutral-700 transition"
              >
                <SiteIcon name="tiktok" size={14} />
                <span>TikTok</span>
              </a>
            </div>
          </div>

          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.id} className={`md:col-span-2 space-y-3 ${idx === 0 ? 'md:col-span-3' : 'md:col-span-2'}`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {getLocalized(section.title)}
              </h4>
              <ul className="space-y-2 text-sm">
                {section.items.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className="inline-flex items-center gap-2 hover:text-red-400 transition">
                      <SiteIcon name={item.icon} size={15} />
                      <span>{getLocalized(item.label)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {getLocalized({ en: 'More', am: 'ተጨማሪ', ar: 'المزيد' })}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ASK_QUESTION.href}
                  className="inline-flex items-center gap-2 hover:text-red-400 transition font-semibold text-red-400"
                >
                  <SiteIcon name={ASK_QUESTION.icon} size={15} />
                  <span>{getLocalized(ASK_QUESTION.label)}</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="inline-flex items-center gap-2 hover:text-white transition">
                  <SiteIcon name="contact" size={15} />
                  <span>{t('nav.contact')}</span>
                </Link>
              </li>
              <li>
                <Link href="/kitab" className="inline-flex items-center gap-2 hover:text-white transition">
                  <SiteIcon name="library" size={15} />
                  <span>{t('nav.kitab')}</span>
                </Link>
              </li>
              <li>
                <Link href="/reminders" className="inline-flex items-center gap-2 hover:text-white transition">
                  <SiteIcon name="articles" size={15} />
                  <span>{t('nav.reminders')}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 space-y-3 sm:space-y-0">
          <p>
            © {new Date().getFullYear()} {siteMetadata.channelName} — {t('rightsReserved')}
          </p>
          <p className="flex items-center space-x-1">
            <span>{t('footerBlessing')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
