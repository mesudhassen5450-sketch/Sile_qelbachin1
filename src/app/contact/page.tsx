'use client';

import React, { useState } from 'react';
import { siteMetadata } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { Phone, Send, Video, MessageSquare, CheckCircle2, ShieldCheck, Youtube } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Phone className="w-3.5 h-3.5" />
          <span>የመገናኛ ገፅ (Contact & Verified Links)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('contactTitle')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
          ከቻናላችን አዘጋጆች ጋር ለመገናኘት፣ አስተያየት ለመስጠት ወይም ትምህርታዊ ጥያቄዎችን ለመጠየቅ ከታች ያሉትን ይፋዊ አድራሻዎች ይጠቀሙ።
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Verified Social Channels Box */}
        <div className="md:col-span-5 space-y-6">
          <div className="portfolio-card p-6 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {t('verifiedSocials')}
              </h2>
            </div>

            <div className="space-y-4">
              
              {/* Verified Telegram */}
              <a
                href={siteMetadata.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start space-x-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition"
              >
                <div className="p-3 rounded-lg bg-sky-600 text-white flex-shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sky-900 dark:text-sky-200 text-base">Verified Telegram</span>
                    <span className="text-xs bg-sky-600 text-white font-bold px-1.5 py-0.5 rounded">✓</span>
                  </div>
                  <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
                    {siteMetadata.telegramHandle}
                  </p>
                  <p className="text-xs text-sky-800 dark:text-sky-300">
                    ዕለታዊ ድርሶች፣ የቁርኣን ተላዋና አጫጭር ማስታወሻዎች።
                  </p>
                </div>
              </a>

              {/* Verified YouTube */}
              <a
                href="https://youtube.com/@sle_qelbachn1?si=jwFjYSDtGE-clwJn"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start space-x-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
              >
                <div className="p-3 rounded-lg bg-red-600 text-white flex-shrink-0">
                  <Youtube className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-red-900 dark:text-red-200 text-base">Verified YouTube</span>
                    <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">✓</span>
                  </div>
                  <p className="text-xs font-mono text-red-700 dark:text-red-400">
                    @sle_qelbachn1
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-300">
                    የቪዲዮ ትምህርቶችና የቀልብ ማስታወሻዎች።
                  </p>
                </div>
              </a>

              {/* Verified TikTok */}
              <a
                href={siteMetadata.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start space-x-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-750 transition"
              >
                <div className="p-3 rounded-lg bg-neutral-900 dark:bg-black text-white flex-shrink-0">
                  <Video className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base">Verified TikTok</span>
                    <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">✓</span>
                  </div>
                  <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    {siteMetadata.tiktokHandle}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    አጫጭር ትምህርታዊ ቪዲዮዎችና የቀልብ ማስታወሻዎች።
                  </p>
                </div>
              </a>

            </div>
          </div>
        </div>

        {/* Static Message Form */}
        <div className="md:col-span-7">
          <div className="portfolio-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <MessageSquare className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {t('sendMessageTitle')}
              </h2>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>{t('messageSuccess')}</span>
                </div>
                <p className="text-sm">
                  ስለ መልእክትዎና ስለ አስተያየትዎ እናመሰግናለን። አላህ በኢስላም ላይ ይበልጥ ያጽናን።
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', message: '' });
                  }}
                  className="text-xs font-bold underline text-emerald-700 dark:text-emerald-300 pt-2"
                >
                  ሌላ መልእክት ለመላክ ይጫኑ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('yourName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="እባክዎን ስምዎን ያስገቡ"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('yourContact')}
                  </label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="አድራሻዎን ያስገቡ (አማራጭ)"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {t('yourMessage')}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="መልእክትዎን፣ ጥያቄዎን ወይም አስተያየትዎን እዚህ ይጻፉ..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-red w-full py-3 rounded-xl font-bold text-base shadow-md"
                >
                  {t('btnSendMessage')}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
