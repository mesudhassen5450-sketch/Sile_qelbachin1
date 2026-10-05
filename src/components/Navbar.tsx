'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import NavAuth from '@/components/auth/NavAuth';
import AskQuestionNavLink from '@/components/AskQuestionNavLink';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/types/media';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import { siteMetadata } from '@/data/channelData';
import {
  EDUCATIONAL_ARCHIVE,
  NAV_SECTIONS,
  YOUTH_HEART_CORNER,
  type NavLink,
} from '@/config/siteNav';
import { SiteIcon } from '@/components/icons/SiteIcons';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  /** Only one desktop popup at a time — prevents overlapping menus */
  const [openMenu, setOpenMenu] = useState<'archive' | 'youth' | 'lang' | null>(null);

  const { language, setLanguage, t, getLocalized } = useLanguage();
  const pathname = usePathname();

  const archiveRef = useRef<HTMLDivElement>(null);
  const youthRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const isArchiveOpen = openMenu === 'archive';
  const isYouthOpen = openMenu === 'youth';
  const isLangOpen = openMenu === 'lang';

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (
        archiveRef.current?.contains(t) ||
        youthRef.current?.contains(t) ||
        langRef.current?.contains(t)
      ) {
        return;
      }
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setOpenMenu(null);
    if (typeof window !== 'undefined' && (window as any).changeLanguage) {
      (window as any).changeLanguage(lang.toLowerCase());
    }
  };

  const languages = [
    { code: 'am' as const, display: 'AM', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'ar' as const, display: 'AR', name: 'العربية', flag: '🇸🇦', isRtl: true },
    { code: 'en' as const, display: 'EN', name: 'English', flag: '🇬🇧' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const archiveActive = EDUCATIONAL_ARCHIVE.some((item) => pathname.startsWith(item.href));
  const youthActive = YOUTH_HEART_CORNER.some((item) => pathname.startsWith(item.href));

  const renderDropdownItems = (items: NavLink[], onClose: () => void) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-start gap-3 px-4 py-2.5 text-sm transition-all ${
          isActive(item.href)
            ? 'bg-red-600/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
            : 'text-neutral-700 dark:text-neutral-200 hover:bg-red-600/10 dark:hover:bg-red-600/15 hover:text-red-700 dark:hover:text-red-400 hover:font-semibold'
        }`}
      >
        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center" aria-hidden>
          <SiteIcon name={item.icon} size={18} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{getLocalized(item.label)}</span>
          <span className="block text-2xs text-neutral-500 dark:text-neutral-400 leading-snug">
            {getLocalized(item.description)}
          </span>
        </span>
      </Link>
    ));

  return (
    <header className="notranslate site-header relative z-40 bg-[#f8f9fb]/88 dark:bg-neutral-900/95 border-b border-[#e5e7eb] dark:border-neutral-800 backdrop-blur-md shadow-[0_1px_0_rgba(229,231,235,0.95)] dark:shadow-none transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none flex items-center justify-center flex-shrink-0"
          aria-label="Toggle Mobile Navigation"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0 flex-1 lg:flex-none">
          <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-red-600/30 group-hover:border-red-600 transition shadow-sm bg-neutral-800 flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt={siteMetadata.channelName}
              fill
              sizes="44px"
              className="object-cover group-hover:scale-105 transition duration-300"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-xl tracking-tight text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition truncate">
              {siteMetadata.channelName}
            </span>
            <span className="hidden sm:block text-2xs text-neutral-500 dark:text-neutral-400 font-mono -mt-1 truncate">
              {siteMetadata.telegramHandle}
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center space-x-1 font-medium">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-red-600/10 dark:hover:bg-red-600/15 hover:text-red-700 dark:hover:text-red-400 hover:font-semibold'
            }`}
          >
            {t('nav.home')}
          </Link>

          <div className="relative" ref={archiveRef}>
            <button
              onClick={() => setOpenMenu(isArchiveOpen ? null : 'archive')}
              onMouseEnter={() => setOpenMenu('archive')}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-1.5 ${
                archiveActive || isArchiveOpen
                  ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-red-600/10 dark:hover:bg-red-600/15 hover:text-red-700 dark:hover:text-red-400 hover:font-semibold'
              }`}
            >
              <span>
                {getLocalized({
                  en: 'Educational Archive',
                  am: 'ትምህርታዊ ማህደር',
                  ar: 'الأرشيف التعليمي',
                })}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isArchiveOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              onMouseLeave={() => setOpenMenu((m) => (m === 'archive' ? null : m))}
              className={`absolute top-full start-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-2 z-50 ${
                isArchiveOpen ? 'block animate-in fade-in slide-in-from-top-2 duration-150' : 'hidden'
              }`}
            >
              {renderDropdownItems(EDUCATIONAL_ARCHIVE, () => setOpenMenu(null))}
            </div>
          </div>

          <div className="relative" ref={youthRef}>
            <button
              onClick={() => setOpenMenu(isYouthOpen ? null : 'youth')}
              onMouseEnter={() => setOpenMenu('youth')}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-1.5 ${
                youthActive || isYouthOpen
                  ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-red-600/10 dark:hover:bg-red-600/15 hover:text-red-700 dark:hover:text-red-400 hover:font-semibold'
              }`}
            >
              <span>
                {getLocalized({
                  en: 'Youth & Heart',
                  am: 'ወጣቶች እና ልብ',
                  ar: 'الشباب والقلب',
                })}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isYouthOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              onMouseLeave={() => setOpenMenu((m) => (m === 'youth' ? null : m))}
              className={`absolute top-full start-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-2 z-50 ${
                isYouthOpen ? 'block animate-in fade-in slide-in-from-top-2 duration-150' : 'hidden'
              }`}
            >
              {renderDropdownItems(YOUTH_HEART_CORNER, () => setOpenMenu(null))}
            </div>
          </div>

          <Link
            href="/contact"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/contact')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-red-600/10 dark:hover:bg-red-600/15 hover:text-red-700 dark:hover:text-red-400 hover:font-semibold'
            }`}
          >
            {t('nav.contact')}
          </Link>

          <AskQuestionNavLink className="ms-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow-md hover:bg-red-700 transition" />
        </nav>

        <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setOpenMenu(isLangOpen ? null : 'lang')}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-red-600 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-700 transition text-xs font-bold uppercase"
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className={`hidden sm:block w-3.5 h-3.5 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute top-full end-0 mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition ${
                      language.toLowerCase() === lang.code
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold border-s-2 border-red-600'
                        : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span className={lang.isRtl ? 'arabic-text' : ''}>{lang.name}</span>
                    </div>
                    {language.toLowerCase() === lang.code && <span className="text-red-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ThemeToggle />
          <NavAuth variant="desktop" />
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-[var(--site-header-height)] bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-[var(--site-header-height)] left-0 right-0 z-40 bg-[#141416] text-white border-b border-neutral-800 px-0 py-0 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#18191c]">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-8 h-8 rounded-full bg-red-600/15 border border-red-600/30 flex items-center justify-center">
                  <SiteIcon name="heart" size={16} />
                </span>
                <span>{siteMetadata.channelName}</span>
              </div>
              <button type="button" onClick={() => setIsMenuOpen(false)} className="text-neutral-400 p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 border-s-4 ${
                isActive('/') ? 'border-red-600 bg-red-600/10' : 'border-transparent'
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <SiteIcon name="home" size={18} />
              </span>
              <span className="font-medium">{t('nav.home')}</span>
            </Link>

            {NAV_SECTIONS.map((section) => (
              <div key={section.id}>
                <p className="px-5 pt-4 pb-1 text-[11px] uppercase tracking-wider text-neutral-500">
                  {getLocalized(section.title)}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-start gap-3 px-5 py-3 border-s-4 ${
                      isActive(item.href) ? 'border-red-600 bg-red-600/10' : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center">
                      <SiteIcon name={item.icon} size={18} />
                    </span>
                    <span>
                      <span className="block font-medium text-[15px]">{getLocalized(item.label)}</span>
                      <span className="block text-[11px] text-neutral-500 mt-0.5">
                        {getLocalized(item.description)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}

            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 border-s-4 ${
                isActive('/contact') ? 'border-red-600 bg-red-600/10' : 'border-transparent'
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                <SiteIcon name="contact" size={18} />
              </span>
              <span className="font-medium">{t('nav.contact')}</span>
            </Link>

            <div className="p-5 border-t border-neutral-800 mt-2 space-y-3">
              <NavAuth variant="mobile" onNavigate={() => setIsMenuOpen(false)} />
              <AskQuestionNavLink
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/30"
              />
            </div>

            <p className="px-5 pb-4 text-[10px] text-neutral-600">
              {getLocalized({
                en: 'Classic pages (Kitab, Reminders, Sahabah…) stay available inside Archive & Library.',
                am: 'የድሮ ገጾች (ኪታብ፣ ማስታወሻ፣ ሶሓባ…) በማህደርና ቤተ-መጻሕፍት ውስጥ ይገኛሉ።',
                ar: 'الصفحات السابقة تبقى متاحة داخل الأرشيف والمكتبة.',
              })}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
