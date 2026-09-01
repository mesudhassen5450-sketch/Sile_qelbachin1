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
} from 'lucide-react';

export default function HomePage() {
  const { t, getLocalized } = useLanguage();

  const featuredKitabs = kitabsData.slice(0, 3);
  const latestDersList = kitabsData[0].dersList.slice(0, 4); // Changed to 4 to include Part 4
  const featuredReminder = remindersData[0];
  const featuredSahabah = sahabahData[0];
  const featuredKnowledge = knowledgeData[0];

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* 1. PROFESSIONAL HIGH-IMPACT HERO SECTION */}
      <section className="w-screen relative left-1/2 -translate-x-1/2 -mt-10 mb-12 overflow-hidden bg-neutral-950 border-b border-neutral-800 shadow-2xl">
        
        {/* Background Image Layer with Calligraphy & Dark Contrast Gradient */}
        <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
          <Image
            src="/logo2hero.jpg"
            alt={siteMetadata.channelName}
            fill
            priority
            className="object-cover w-full h-full opacity-20 scale-105 filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/85 to-red-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-600/15 via-transparent to-transparent" />
        </div>

        {/* Hero Content Grid Layer */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-28 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Column: Typography, Hadith Glass Box, and Interactive CTAs */}
          <div className="w-full lg:w-7/12 space-y-8 text-left">
            
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
            <div className="backdrop-blur-xl bg-neutral-900/80 border border-neutral-800/80 p-6 sm:p-8 rounded-3xl border-l-4 border-l-red-600 shadow-2xl space-y-4">
              <p className="text-lg sm:text-2xl font-semibold leading-relaxed text-neutral-100 tracking-tight">
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
                <span>Listen to Audio Lectures (ድምፅ ድርሶች)</span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </Link>

              <Link
                href="/kitab"
                className="inline-flex items-center space-x-2.5 px-7 py-4 rounded-2xl font-bold text-sm sm:text-base bg-neutral-900/90 text-white hover:bg-neutral-800 border border-neutral-700/80 backdrop-blur-md shadow-xl hover:border-red-600/50 transition"
              >
                <BookOpen className="w-5 h-5 text-red-500" />
                <span>Explore Kitab (ኪታቦች)</span>
              </Link>

              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base bg-sky-600/90 hover:bg-sky-500 text-white transition shadow-xl border border-sky-500/30"
              >
                <Send className="w-5 h-5" />
                <span>Telegram Channel</span>
              </a>
            </div>

          </div>

          {/* Right Column: Interactive Card Showcase */}
          <div className="w-full lg:w-5/12 flex justify-center">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden p-6 space-y-6 shadow-2xl">
                
                <div className="relative h-56 rounded-2xl overflow-hidden border border-neutral-800">
                  <Image
                    src="/logo2hero.jpg"
                    alt={siteMetadata.channelName}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      <span className="text-xs font-mono text-red-400 font-bold">ይፋዊ ማህበረሰብ</span>
                      <h3 className="text-lg font-bold text-white">{siteMetadata.channelName}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-red-500" />
                      <span>የድምፅ ድርሶች (Audio Archives)</span>
                    </span>
                    <span className="font-mono text-red-400 font-bold">180+ Tracks</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-red-500" />
                      <span>የኪታብ PDF ፋይሎች (Kitab PDFs)</span>
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

      {/* 3. FEATURED KITAB SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              <span>{t('sections.featuredKitab')}</span>
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
              <span>Featured Audio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Latest Audio Teachings
            </h2>
          </div>
          <Link
            href="/audio-lecture"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <span>View All Audio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Blocks: Three Main Tracks (Removed Intebih Part 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Track 1: Poetry */}
          <FeaturedAudioBlock
            title={{ am: "#ግጥም1 — ማረኝ ጌታየ ሆይ!!", ar: "قصيدة — يا ربي", en: "Poetry — My Lord" }}
            speaker="በ ኡስታዝ፦ ሙሓመድ ሲራጅ ተገጥሞ፤ በ ወንድም አቡ ሱፍያን ድምፅ የቀረበ"
            audioUrl="https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ማረኝ_የኔ_ጌታ…!የ_ኡስታዝ_መመሀመድ_ሲራጁ_ግጥም.m4a"
            category="ግጥም (Poetry)"
          />

          {/* Track 2: Anxiety & Stress Advice */}
          <FeaturedAudioBlock
            title={{ am: "ከ ሐሳብ እና ከ ጭንቀት እንዴት መውጣት እንችላለን?", ar: "كيف نتخلص من القلق والحزن؟", en: "How to Overcome Anxiety & Stress?" }}
            speaker="አቅራቢ፦ ኡስታዝ አብዱ ረዛቅ አል-ባጂ"
            audioUrl="https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ከጭንቀት_እና_ከ_ሐሳብ_መውጫ_መንገዶች!.mp3"
            category="መልእክት (Advice)"
          />

          {/* Track 3: Marriage & Islam */}
          <FeaturedAudioBlock
            title={{ am: "ትዳር እና እስልምና 🌷 🌹 🥀 - የ ወንጀል መዘዝ!!", ar: "الزواج والإسلام — عواقب الذنوب", en: "Marriage & Islam — Consequences of Sin" }}
            speaker="ወንድም አቡ ሱፍያን"
            duration="52:43"
            description="ወንጀልን መሥራት በሰው ልጅ ላይ በዱንያ እና በ ኣኺራ ላይ የሚያመጣው ተፅዕኖ!"
            audioUrl="https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ትዳር እና እስልምና.ogg"
            category="ትዳር (Marriage)"
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

      {/* 8. TELEGRAM BANNER SECTION */}
      <section>
        <div className="bg-sky-950/80 border border-sky-800/60 rounded-2xl p-6 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold">📱 Join the Telegram Channel</h3>
            <p className="text-sm text-sky-200">
              ዕለታዊ የቁርኣን፣ የሐዲሥና የኪታብ ድርሶችን በቴሌግራም ቻናላችን ይከታተሉ፡ <strong className="text-white">{siteMetadata.telegramHandle}</strong>
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

    </div>
  );
}