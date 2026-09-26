'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  siteMetadata,
  kitabsData,
  remindersData,
  sahabahData,
  knowledgeData,
} from '@/data/channelData';
import KitabCard from '@/components/KitabCard';
import AudioCard from '@/components/AudioCard';
import FeaturedAudioBlock from '@/components/FeaturedAudioBlock';
import CompactAudioRow from '@/components/CompactAudioRow';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookOpen,
  Headphones,
  Send,
  ArrowRight,
  Heart,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Radio,
  ChevronRight,
  Smartphone,
  Compass,
  BookMarked,
  Bell,
  Globe2,
  Clock3,
} from 'lucide-react';
import HomeReminders from '@/components/HomeReminders';
import HeroCardMedia from '@/components/HeroCardMedia';
import PartnerIkhlasSection from '@/components/PartnerIkhlasSection';
import { SITELINK_PAGES, getSitePageCopy } from '@/lib/seo';
import { useEffect, useState } from 'react';

const CMS_KITABS_URL = (
  process.env.NEXT_PUBLIC_CMS_API_BASE || 'https://admin.sileqelbachin1.com/api/public/v1'
).replace(/\/+$/, '') + '/kitabs';

export default function HomePage() {
  const { t, getLocalized, language } = useLanguage();

  const [featuredKitabs, setFeaturedKitabs] = useState(() => kitabsData.slice(0, 3));
  const latestDersList = [...(featuredKitabs[0]?.dersList || kitabsData[0].dersList)].reverse().slice(0, 5);
  const featuredReminder = remindersData[0];
  const featuredSahabah = sahabahData[0];
  const featuredKnowledge = knowledgeData[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${CMS_KITABS_URL}?t=${Date.now()}`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok || !body?.ok || !Array.isArray(body.data) || !body.data.length) return;
        const order = [
          'intebih-ante-murakeb',
          'adewae-kitab',
          'fatihu-awliya',
          'alwasail-almufida',
          'teshilu-alimu-sheria',
          'yekelb-medreq',
          'betewbet-mengede-lay',
        ];
        const mapped = body.data.map((row: {
          slug: string;
          title?: { am?: string; en?: string; ar?: string };
          author?: { am?: string; en?: string; ar?: string };
          description?: { am?: string; en?: string; ar?: string };
          coverImage?: string | null;
          pdfUrl?: string | null;
          dersCount?: number;
          dersList?: typeof kitabsData[0]['dersList'];
        }) => {
          const loc = (v?: { am?: string; en?: string; ar?: string }) => ({
            am: v?.am || '',
            ar: v?.ar || '',
            en: v?.en || '',
          });
          return {
            slug: row.slug,
            title: loc(row.title),
            author: loc(row.author),
            category: { am: '', ar: '', en: '' },
            coverImage: row.coverImage || undefined,
            pdfUrl: row.pdfUrl || undefined,
            dersCount: row.dersCount ?? (row.dersList?.length || 0),
            description: loc(row.description),
            dersList: row.dersList || [],
          };
        });
        mapped.sort((a: { slug: string }, b: { slug: string }) => {
          const ia = order.indexOf(a.slug);
          const ib = order.indexOf(b.slug);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        if (!cancelled) setFeaturedKitabs(mapped.slice(0, 3));
      } catch {
        // keep static until API is reachable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const appFeatures = [
    { label: t('appFeatureQibla'), icon: Compass },
    { label: t('appFeatureQuran'), icon: BookMarked },
    { label: t('appFeatureAzan'), icon: Clock3 },
    { label: t('appFeatureReminder'), icon: Bell },
    { label: t('appFeatureDers'), icon: Headphones },
    { label: t('appFeatureKitab'), icon: BookOpen },
    { label: t('appFeatureGlobal'), icon: Globe2 },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* 1. PROFESSIONAL HIGH-IMPACT HERO SECTION */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 -mt-6 mb-12 overflow-hidden bg-neutral-950 border-b border-neutral-800 shadow-2xl">
        
        {/* Background Image Layer with Calligraphy & Dark Contrast Gradient */}
        <div className="absolute inset-0 w-full h-full -z-10 flex items-center justify-center">
          <div className="relative w-[82%] sm:w-full h-full max-w-4xl mx-auto">
            <Image
              src="/logo2hero.jpg"
              alt={siteMetadata.channelName}
              width={800}
              height={800}
              priority
              className="w-full h-auto opacity-20 filter blur-sm mx-auto block"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/85 to-red-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/15 via-transparent to-transparent" />
        </div>

        {/* Hero Content Grid Layer */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Column: Typography, Hadith Glass Box, and Interactive CTAs */}
          <div className="w-full lg:w-7/12 space-y-8 text-start">
            
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md">
                <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                {siteMetadata.channelName}{' '}
                <span className="block text-2xl sm:text-3xl font-bold font-mono text-red-500 mt-2">
                  {siteMetadata.telegramHandle}
                </span>
              </h1>
            </div>

            {/* Hadith Quote Glass Box Component */}
            <div className="backdrop-blur-xl bg-neutral-900/80 border border-neutral-800/80 p-6 sm:p-8 rounded-3xl border-s-4 border-s-red-600 shadow-2xl space-y-4">
              <p className={`text-lg sm:text-2xl font-semibold leading-relaxed text-neutral-100 tracking-tight ${language === 'ar' ? 'arabic-text' : ''}`}>
                {getLocalized(siteMetadata.heroHadithText)}
              </p>
              <div className="flex items-center justify-end font-bold text-xs sm:text-sm text-red-400">
                <span>{getLocalized(siteMetadata.heroHadithSource)}</span>
              </div>
            </div>

            {/* Interactive Primary & Secondary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/audio-lecture"
                className="btn-red inline-flex items-center space-x-2.5 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base shadow-xl hover:scale-105 transition"
              >
                <Headphones className="w-5 h-5 text-white" />
                <span>{t('hero.listenAudio')}</span>
                <ChevronRight className="w-4 h-4 text-white/80 rtl:rotate-180" />
              </Link>

              <Link
                href="/kitab"
                className="inline-flex items-center space-x-2.5 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base bg-neutral-900/90 text-white hover:bg-neutral-800 border border-neutral-700/80 backdrop-blur-md shadow-xl hover:border-red-600/50 transition"
              >
                <BookOpen className="w-5 h-5 text-red-500" />
                <span>{t('hero.exploreKitab')}</span>
              </Link>

              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base bg-sky-600/90 hover:bg-sky-500 text-white transition shadow-xl border border-sky-500/30"
              >
                <Send className="w-5 h-5" />
                <span>{t('hero.telegramChannel')}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Interactive Card Showcase */}
          <div className="w-full lg:w-5/12 flex justify-center">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden p-6 space-y-6 shadow-2xl">
                
                <HeroCardMedia />

                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-red-500" />
                      <span>{t('audioArchives')}</span>
                    </span>
                    <span className="font-mono text-red-400 font-bold">180+ Tracks</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-red-500" />
                      <span>{t('kitabPdfs')}</span>
                    </span>
                    <span className="font-mono text-red-400 font-bold">22+ Books</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. EDITORIAL PURPOSE SECTION (Matching Portfolio Card Aesthetic) */}
      <section className="max-w-4xl mx-auto">
        <div className="portfolio-card p-8 md:p-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[#D32F2F] text-xl">❤️</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('purpose.title')}</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base pt-2">
            {getLocalized(siteMetadata.purposeParagraph1)}
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base pt-2 border-t border-gray-100 dark:border-gray-800">
            {getLocalized(siteMetadata.purposeParagraph2)}
          </p>
        </div>
      </section>

      <HomeReminders />

      {/* 2b. SITELINK / SECTION DIRECTORY (clear homepage anchors for Google + visitors) */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{t('sections.exploreSite')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            {t('sections.mainSections')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SITELINK_PAGES.map((page) => {
            const copy = getSitePageCopy(page, language);
            return (
            <Link
              key={page.path}
              href={page.path}
              className="portfolio-card p-5 space-y-2 hover:border-red-500/40 hover:-translate-y-0.5 transition group"
            >
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-red-600 transition">
                {copy.name}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {copy.description}
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-red-600">
                {language === 'en' ? `${t('sections.open')} ${copy.name}` : `${copy.name} ${t('sections.open')}`}
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED KITAB SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              <span>{t('sections.featuredKitabLabel')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              {t('sections.featuredKitab')}
            </h2>
          </div>
          <Link
            href="/kitab"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <span>{t('sections.viewAllKitabs')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredKitabs.map((kitab) => (
            <KitabCard key={kitab.slug} kitab={kitab} />
          ))}
        </div>
      </section>

      {/* 4. LATEST DERS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <Headphones className="w-4 h-4" />
              <span>{t('sections.latestDers')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              {t('sections.latestDers')}
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {latestDersList.map((ders) => (
            <AudioCard key={ders.id} track={ders} playlist={latestDersList} />
          ))}
        </div>
      </section>

      {/* 5. FEATURED AUDIO SECTION - LATEST CONTENT */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <Headphones className="w-4 h-4" />
              <span>{t('sections.popularAudioLabel')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              {t('sections.popularAudio')}
            </h2>
          </div>
          <Link
            href="/audio-lecture"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <span>{t('sections.viewAllAudio')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Blocks: Three Main Tracks (Removed Intebih Part 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Track 1: Poetry */}
          <FeaturedAudioBlock
            title={{ am: "#ግጥም1 — ማረኝ ጌታየ ሆይ!!", ar: "قصيدة — يا ربي", en: "Poetry — My Lord" }}
            speaker="በ ኡስታዝ፦ ሙሓመድ ሲራጅ ተገጥሞ፤ በ ወንድም አቡ ሱፍያን ድምፅ የቀረበ"
            audioUrl="/telegram_media/files/home page audio/ማረኝ_የኔ_ጌታ…!የ_ኡስታዝ_መመሀመድ_ሲራጁ_ግጥም.m4a"
            category={{ am: 'ግጥም', ar: 'شعر', en: 'Poetry' }}
          />

          {/* Track 2: Anxiety & Stress Advice */}
          <FeaturedAudioBlock
            title={{ am: "ከ ሐሳብ እና ከ ጭንቀት እንዴት መውጣት እንችላለን?", ar: "كيف نتخلص من القلق والحزن؟", en: "How to Overcome Anxiety & Stress?" }}
            speaker="አቅራቢ፦ ኡስታዝ አብዱ ረዛቅ አል-ባጂ"
            audioUrl="/telegram_media/files/home page audio/ከጭንቀት_እና_ከ_ሐሳብ_መውጫ_መንገዶች!.mp3"
            category={{ am: 'መልእክት', ar: 'نصيحة', en: 'Advice' }}
          />

          {/* Track 3: Marriage & Islam */}
          <FeaturedAudioBlock
            title={{ am: "ትዳር እና እስልምና 🌷 🌹 🥀 - የ ወንጀል መዘዝ!!", ar: "الزواج والإسلام — عواقب الذنوب", en: "Marriage & Islam — Consequences of Sin" }}
            speaker="ወንድም አቡ ሱፍያን"
            duration="52:43"
            description="ወንጀልን መሥራት በሰው ልጅ ላይ በዱንያ እና በ ኣኺራ ላይ የሚያመጣው ተፅዕኖ!"
            audioUrl="/telegram_media/files/home page audio/ትዳር እና እስልምና.ogg"
            category={{ am: 'ትዳር', ar: 'الزواج', en: 'Marriage' }}
          />

        </div>
      </section>

      {/* 6. REMINDER & SAHABAH GRID SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Featured Reminder */}
        <div className="portfolio-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                <Heart className="w-3.5 h-3.5" />
                <span>{t('nav.reminders')}</span>
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                {featuredReminder.category}
              </span>
            </div>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {getLocalized(featuredReminder.title)}
            </h3>

            <p className="text-base text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
              "{getLocalized(featuredReminder.content)}"
            </p>
            
            <p className="text-xs font-bold text-red-600 dark:text-red-400">
              — {getLocalized(featuredReminder.source)}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href="/reminders"
              className="inline-flex items-center space-x-2 text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <span>{t('sections.viewReminders')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Featured Sahabah Lesson */}
        <div className="portfolio-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                <span>{t('nav.sahabah')}</span>
              </span>
            </div>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {getLocalized(featuredSahabah.name)}
            </h3>

            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {getLocalized(featuredSahabah.title)}
            </p>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {getLocalized(featuredSahabah.shortDescription)}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href={`/sahabah/${featuredSahabah.slug}`}
              className="inline-flex items-center space-x-2 text-sm font-bold text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition"
            >
              <span>{t('sections.readSahabah')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </section>

      {/* 7. QUR'AN & HADITH SPOTLIGHT */}
      <section>
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950 text-white rounded-2xl p-6 sm:p-10 border border-neutral-800 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
              <Bookmark className="w-4 h-4" />
              <span>{t('sections.spotlight')}</span>
            </div>
            <Link
              href="/knowledge"
              className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center space-x-1"
            >
              <span>{t('sections.viewKnowledge')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="arabic-text text-2xl sm:text-3xl text-amber-300 font-bold">
              {featuredKnowledge.arabicText}
            </div>
            <p className="text-lg text-white font-semibold">
              {getLocalized(featuredKnowledge.amharicText)}
            </p>
            <p className="text-xs text-neutral-400 font-mono">
              {getLocalized(featuredKnowledge.reference)}
            </p>
          </div>
        </div>
      </section>

      {/* 8. MOBILE APP COMING SOON */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 85% 20%, rgba(185,28,28,0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(127,29,29,0.25), transparent 50%), linear-gradient(160deg, #0a0a0b 0%, #171717 55%, #1c1917 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-6 p-6 sm:p-10 lg:p-12 items-center">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/50 px-3 py-1 text-xs font-semibold tracking-wide text-red-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('appComingSoonBadge')}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">Digital App</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                {t('appComingSoonTitle')}
              </h2>
              <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
                {t('appComingSoonBody')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {appFeatures.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-100 backdrop-blur-sm transition hover:border-red-500/40 hover:bg-red-950/40"
                >
                  <Icon className="w-3.5 h-3.5 text-red-400" />
                  {label}
                </span>
              ))}
            </div>

            <p className="text-sm text-neutral-400">
              {t('appNotifyHint')}:{' '}
              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-red-400 hover:text-red-300 transition"
              >
                {siteMetadata.telegramHandle}
              </a>
            </p>
          </div>

          {/* Phone mock — visual only */}
          <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[280px] lg:justify-self-end">
            <div className="absolute -inset-8 rounded-full bg-red-600/20 blur-3xl animate-pulse" />
            <div className="relative rounded-[2rem] border border-neutral-700 bg-neutral-900 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="rounded-[1.5rem] overflow-hidden bg-neutral-950 border border-neutral-800">
                <div className="h-7 bg-neutral-900 flex items-center justify-center">
                  <div className="h-1.5 w-16 rounded-full bg-neutral-700" />
                </div>
                <div className="px-4 pt-3 pb-5 space-y-4 min-h-[380px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Sile Qelbachin</p>
                      <p className="text-sm font-bold text-white">ስለ ቀልባችን</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-red-900/60 to-neutral-900 border border-red-800/40 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-300 text-xs font-semibold">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t('appFeatureQibla')}</span>
                    </div>
                    <div className="mx-auto w-20 h-20 rounded-full border-2 border-red-500/50 flex items-center justify-center relative">
                      <div className="absolute inset-2 rounded-full border border-dashed border-red-400/30 animate-[spin_12s_linear_infinite]" />
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[18px] border-l-transparent border-r-transparent border-b-red-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: BookMarked, label: t('appFeatureQuran') },
                      { icon: Clock3, label: t('appFeatureAzan') },
                      { icon: Bell, label: t('appFeatureReminder') },
                      { icon: Headphones, label: t('appFeatureDers') },
                      { icon: BookOpen, label: t('appFeatureKitab') },
                      { icon: Globe2, label: t('appFeatureGlobal') },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="rounded-xl bg-white/5 border border-white/10 p-2.5 flex flex-col items-center gap-1.5 text-center"
                      >
                        <Icon className="w-4 h-4 text-red-400" />
                        <span className="text-[9px] leading-tight text-neutral-300 font-medium line-clamp-2">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-red-600 text-center py-2.5 text-xs font-bold tracking-wide">
                    {t('appComingSoonBadge')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8b. LIVE DERS — STAY TUNED (honest teaser) */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/90 text-white overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0 w-11 h-11 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
              <span className="absolute -top-1 -end-1 h-2.5 w-2.5 rounded-full bg-neutral-500 border border-neutral-900" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded-full">
                  {t('liveStayTunedBadge')}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500">
                  {t('liveStayTunedStyle')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                {t('liveStayTunedTitle')}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t('liveStayTunedBody')}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 sm:text-end space-y-1">
            <p className="text-[11px] font-semibold text-neutral-500">{t('liveNotActiveYet')}</p>
            <a
              href={siteMetadata.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {siteMetadata.telegramHandle}
            </a>
          </div>
        </div>
      </section>

      {/* 9. TELEGRAM BANNER SECTION */}
      <section>
        <div className="bg-sky-950/80 border border-sky-800/60 rounded-2xl p-6 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold">{t('hero.joinTelegramBanner')}</h3>
            <p className="text-sm text-sky-200">
              {t('hero.telegramBannerSub')}: <strong className="text-white">{siteMetadata.telegramHandle}</strong>
            </p>
          </div>

          <a
            href={siteMetadata.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-red inline-flex items-center space-x-3 px-6 py-3.5 rounded-xl font-bold text-base shadow-lg hover:scale-105 transition flex-shrink-0"
          >
            <Send className="w-5 h-5" />
            <span>{t('hero.btnTelegram')}</span>
          </a>
        </div>
      </section>

      {/* 10. PARTNER — ኢኽላስ (directly above footer) */}
      <PartnerIkhlasSection />

    </div>
  );
}
