'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/types/media';
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  Heart,
  BookOpen,
  ShieldCheck,
  Headphones,
  Video,
} from 'lucide-react';
import { siteMetadata } from '@/data/channelData';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubpagesOpen, setIsSubpagesOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

  const subpagesRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSubpagesOpen(false);
    setIsLangOpen(false);
  }, [pathname]);

  // Handle clicking outside of dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subpagesRef.current && !subpagesRef.current.contains(event.target as Node)) {
        setIsSubpagesOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangOpen(false);

    // Call global Google Translate controller if bound
    if (typeof window !== 'undefined' && (window as any).changeLanguage) {
      (window as any).changeLanguage(lang.toLowerCase());
    }
  };

  const subpageItems = [
    {
      label: t('nav.reminders'),
      href: '/reminders',
      icon: <Heart className="w-4 h-4 text-red-500" />,
    },
    {
      label: t('nav.knowledge'),
      href: '/knowledge',
      icon: <BookOpen className="w-4 h-4 text-red-500" />,
    },
    {
      label: t('nav.sahabah'),
      href: '/sahabah',
      icon: <ShieldCheck className="w-4 h-4 text-red-500" />,
    },
    {
      label: t('nav.muhadara'),
      href: '/muhadara',
      icon: <Headphones className="w-4 h-4 text-red-500" />,
    },
    {
      label: t('nav.videos'),
      href: '/video-lecture',
      icon: <Video className="w-4 h-4 text-red-500" />,
    },
  ];

  const languages = [
    { code: 'am' as const, display: 'AM', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'ar' as const, display: 'AR', name: 'العربية', flag: '🇸🇦', isRtl: true },
    { code: 'en' as const, display: 'EN', name: 'English', flag: '🇬🇧' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isSubpageActive = subpageItems.some((item) => pathname.startsWith(item.href));

  if (!mounted) return null;

  return (
    <header className="notranslate fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Title (Anchored Far Left) */}
        <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-red-600/30 group-hover:border-red-600 transition shadow-sm">
            <Image
              src="/logo.jpg"
              alt={siteMetadata.channelName}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition">
              {siteMetadata.channelName}
            </span>
            <span className="text-2xs text-neutral-500 dark:text-neutral-400 font-mono -mt-1">
              {siteMetadata.telegramHandle}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 font-medium">
          
          {/* 1. 🏠 Home */}
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {t('nav.home')}
          </Link>

          {/* 2. 📖 Kitab */}
          <Link
            href="/kitab"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/kitab')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {t('nav.kitab')}
          </Link>

          {/* 3. 🎧 Online Audio Lecture */}
          <Link
            href="/audio-lecture"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/audio-lecture')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {t('nav.audioLecture')}
          </Link>

          {/* 4. 📚 ትምህርታዊ ክፍሎች (Educational Subpages Dropdown) */}
          <div className="relative" ref={subpagesRef}>
            <button
              onClick={() => setIsSubpagesOpen(!isSubpagesOpen)}
              onMouseEnter={() => setIsSubpagesOpen(true)}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-1.5 ${
                isSubpageActive || isSubpagesOpen
                  ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span>{t('nav.subpages')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSubpagesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSubpagesOpen && (
              <div
                onMouseLeave={() => setIsSubpagesOpen(false)}
                className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400">
                    {t('nav.subpages')}
                  </span>
                </div>
                {subpageItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSubpagesOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition ${
                      isActive(item.href)
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 5. 📞 Contact */}
          <Link
            href="/contact"
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isActive('/contact')
                ? 'bg-red-700/10 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {t('nav.contact')}
          </Link>

        </nav>

        {/* Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          
          {/* Language Switcher Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-red-600 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-700 transition text-xs font-bold uppercase"
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition ${
                      language.toLowerCase() === lang.code
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold border-l-2 border-red-600'
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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Navigation Trigger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none z-50 flex items-center justify-center"
            aria-label="Toggle Mobile Navigation"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 top-20 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-20 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            
            {/* Primary Nav Links */}
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive('/') ? 'bg-red-600 text-white font-semibold shadow-md' : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/kitab"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive('/kitab') ? 'bg-red-600 text-white font-semibold shadow-md' : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {t('nav.kitab')}
              </Link>
              <Link
                href="/audio-lecture"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive('/audio-lecture') ? 'bg-red-600 text-white font-semibold shadow-md' : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {t('nav.audioLecture')}
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive('/contact') ? 'bg-red-600 text-white font-semibold shadow-md' : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {t('nav.contact')}
              </Link>
            </div>

            {/* Subpages Links */}
            <div className="space-y-1 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400 px-2">
                {t('nav.subpages')}
              </span>
              {subpageItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition ${
                    isActive(item.href)
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}