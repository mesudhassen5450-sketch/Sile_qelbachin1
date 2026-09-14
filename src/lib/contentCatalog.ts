/**
 * Unified content catalog for search, shareable routes, AI navigation, and speakers.
 * Built only from existing verified site data — never invents Islamic content.
 */

import {
  kitabsData,
  muhadarasData,
  remindersData,
  knowledgeData,
  sahabahData,
  type Ders,
  type Kitab,
  type Muhadara,
  type Reminder,
  type KnowledgeItem,
  type Sahabah,
} from '@/data/channelData';
import { getAudios, getVideos, getPdfs } from '@/data/mediaStore';
import type { LocalizedString } from '@/context/LanguageContext';

export type ContentType =
  | 'kitab'
  | 'ders'
  | 'muhadara'
  | 'reminder'
  | 'knowledge'
  | 'sahabah'
  | 'speaker'
  | 'audio'
  | 'video'
  | 'pdf';

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  titleAm?: string;
  titleAr?: string;
  description?: string;
  speaker?: string;
  author?: string;
  href: string;
  score: number;
}

export interface DersRecord {
  ders: Ders;
  kitab: Kitab;
  partNumber: number | null;
  href: string;
}

export interface SpeakerProfile {
  slug: string;
  name: string;
  nameLocalized: LocalizedString | string;
  dersIds: string[];
  kitabSlugs: string[];
  muhadaraIds: string[];
  /** Biography intentionally omitted — not inventing bios */
}

function asLocalized(value: string | LocalizedString | undefined): LocalizedString {
  if (!value) return { am: '', ar: '', en: '' };
  if (typeof value === 'string') return { am: value, ar: value, en: value };
  return value;
}

function textAll(value: string | LocalizedString | undefined): string {
  const loc = asLocalized(value);
  return [loc.am, loc.ar, loc.en].filter(Boolean).join(' ');
}

function primaryText(value: string | LocalizedString | undefined, prefer: 'en' | 'am' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[prefer] || value.en || value.am || value.ar || '';
}

/** Light cleanup for display grouping only — does not invent names */
export function normalizeSpeakerKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^by\s+brother\s+/i, '')
    .replace(/^በ\s*ወንድም\s+/, '')
    .replace(/^ustaz\s+/i, '')
    .replace(/^ustadh\s+/i, '')
    .replace(/^ኡስታዝ\s+/, '')
    .replace(/^الأستاذ\s+/, '')
    .replace(/^بالأخ\s+/, '')
    .replace(/[^\w\s\u1200-\u137F\u0600-\u06FF-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifySpeaker(name: string): string {
  const key = normalizeSpeakerKey(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-');
  return key || 'speaker';
}

export function extractPartNumber(title: string | LocalizedString, dersId?: string): number | null {
  const blob = `${textAll(title)} ${dersId || ''}`;
  const patterns = [
    /ders[-_\s]*(\d+)/i,
    /part[-_\s]*0*(\d+)/i,
    /ክፍል[-_\s]*0*(\d+)/,
    /الجزء[-_\s]*0*(\d+)/,
    /\b0*(\d+)\b/,
  ];
  for (const re of patterns) {
    const m = blob.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > 0 && n < 500) return n;
    }
  }
  return null;
}

export function getAllDers(): DersRecord[] {
  const out: DersRecord[] = [];
  for (const kitab of kitabsData) {
    for (const ders of kitab.dersList) {
      out.push({
        ders,
        kitab,
        partNumber: extractPartNumber(ders.title, ders.id),
        href: `/ders/${ders.id}`,
      });
    }
  }
  return out;
}

export function getDersById(id: string): DersRecord | null {
  return getAllDers().find((d) => d.ders.id === id) || null;
}

export function getKitabBySlug(slug: string): Kitab | null {
  return kitabsData.find((k) => k.slug === slug) || null;
}

/**
 * Resolve exact ders: kitab hint + part number (e.g. Intebih + 3).
 */
export function resolveDers(kitabHint: string | null, partNumber: number | null): DersRecord | null {
  const all = getAllDers();
  if (!kitabHint && partNumber == null) return null;

  let candidates = all;
  if (kitabHint) {
    const hint = kitabHint.toLowerCase();
    const slug = mapKitabHintToSlug(hint);
    candidates = all.filter((d) => {
      if (slug && d.kitab.slug === slug) return true;
      const titles = textAll(d.kitab.title).toLowerCase();
      return titles.includes(hint) || d.kitab.slug.includes(hint.replace(/\s+/g, '-'));
    });
  }

  if (partNumber != null) {
    const byPart = candidates.filter((d) => d.partNumber === partNumber);
    if (byPart.length === 1) return byPart[0];
    if (byPart.length > 1) return byPart[0];
    // Fallback: id suffix -ders-N
    const byId = candidates.find((d) => d.ders.id.endsWith(`-ders-${partNumber}`));
    if (byId) return byId;
  }

  return candidates[0] || null;
}

export function mapKitabHintToSlug(input: string): string | null {
  const lower = input.toLowerCase();
  if (/intebih|murakeb|ante\s*murakeb|ኢንተቢህ/i.test(lower)) return 'intebih-ante-murakeb';
  if (/adewae|ad-?da'|dawa|disease|cure|ዳእ|ደዋእ/i.test(lower)) return 'adewae-kitab';
  if (/fatihu|awliya|ፋቲሁ/i.test(lower)) return 'fatihu-awliya';
  if (/alwasail|wasail|mufida|happy\s*life|ዋሳኢል/i.test(lower)) return 'alwasail-almufida';
  if (/teshilu|alimu|sheria|ተሺሉ/i.test(lower)) return 'teshilu-alimu-sheria';
  if (/yekelb|medreq|hardness|የቀልብ\s*መድረቅ/i.test(lower)) return 'yekelb-medreq';
  if (/betewbet|repentance|መንገደ|ተውባ/i.test(lower)) return 'betewbet-mengede-lay';
  return null;
}

export function getReminderById(id: string): Reminder | null {
  return remindersData.find((r) => r.id === id) || null;
}

export function getMuhadaraById(id: string): Muhadara | null {
  return muhadarasData.find((m) => m.id === id) || null;
}

export function getSahabahBySlug(slug: string): Sahabah | null {
  return sahabahData.find((s) => s.slug === slug) || null;
}

export function getKnowledgeById(id: string): KnowledgeItem | null {
  return knowledgeData.find((k) => k.id === id) || null;
}

/** Speakers derived only from existing ders/muhadara speaker fields — no invented bios */
export function getSpeakers(): SpeakerProfile[] {
  const map = new Map<string, SpeakerProfile>();

  const upsert = (
    speakerValue: string | LocalizedString,
    opts: { dersId?: string; kitabSlug?: string; muhadaraId?: string }
  ) => {
    const loc = asLocalized(speakerValue);
    const display = loc.en || loc.am || loc.ar;
    if (!display.trim()) return;
    const slug = slugifySpeaker(display);
    const existing = map.get(slug);
    if (!existing) {
      map.set(slug, {
        slug,
        name: display,
        nameLocalized: loc,
        dersIds: opts.dersId ? [opts.dersId] : [],
        kitabSlugs: opts.kitabSlug ? [opts.kitabSlug] : [],
        muhadaraIds: opts.muhadaraId ? [opts.muhadaraId] : [],
      });
      return;
    }
    if (opts.dersId && !existing.dersIds.includes(opts.dersId)) existing.dersIds.push(opts.dersId);
    if (opts.kitabSlug && !existing.kitabSlugs.includes(opts.kitabSlug)) {
      existing.kitabSlugs.push(opts.kitabSlug);
    }
    if (opts.muhadaraId && !existing.muhadaraIds.includes(opts.muhadaraId)) {
      existing.muhadaraIds.push(opts.muhadaraId);
    }
  };

  for (const kitab of kitabsData) {
    for (const ders of kitab.dersList) {
      upsert(ders.speaker, { dersId: ders.id, kitabSlug: kitab.slug });
    }
  }
  for (const m of muhadarasData) {
    upsert(m.speaker, { muhadaraId: m.id });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getSpeakerBySlug(slug: string): SpeakerProfile | null {
  return getSpeakers().find((s) => s.slug === slug) || null;
}

function scoreMatch(haystack: string, query: string): number {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 60;
  const tokens = q.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const t of tokens) {
    if (h.includes(t)) hits += 1;
  }
  if (hits === 0) return 0;
  return Math.round((hits / tokens.length) * 40);
}

/**
 * Global search across verified catalog content.
 * Media-store telegram dump items included with listing-page links (no invented detail pages).
 */
export function globalSearch(query: string, limit = 40): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const kitab of kitabsData) {
    const title = primaryText(kitab.title);
    const blob = `${textAll(kitab.title)} ${textAll(kitab.author)} ${textAll(kitab.category)} ${textAll(kitab.description)} ${kitab.slug}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: kitab.slug,
        type: 'kitab',
        title,
        titleAm: asLocalized(kitab.title).am,
        titleAr: asLocalized(kitab.title).ar,
        description: primaryText(kitab.description),
        author: primaryText(kitab.author),
        href: `/kitab/${kitab.slug}`,
        score: score + 10,
      });
    }
  }

  for (const rec of getAllDers()) {
    const title = primaryText(rec.ders.title);
    const blob = `${textAll(rec.ders.title)} ${textAll(rec.ders.speaker)} ${textAll(rec.kitab.title)} ${rec.ders.id} ders ${rec.partNumber ?? ''}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: rec.ders.id,
        type: 'ders',
        title: `${primaryText(rec.kitab.title)} — ${title}`,
        titleAm: asLocalized(rec.ders.title).am,
        speaker: primaryText(rec.ders.speaker),
        href: rec.href,
        score,
      });
    }
  }

  for (const m of muhadarasData) {
    const blob = `${textAll(m.title)} ${textAll(m.speaker)} ${textAll(m.topic)}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: m.id,
        type: 'muhadara',
        title: primaryText(m.title),
        speaker: primaryText(m.speaker),
        description: primaryText(m.topic),
        href: `/muhadara/${m.id}`,
        score,
      });
    }
  }

  for (const r of remindersData) {
    const blob = `${textAll(r.title)} ${textAll(r.content)} ${textAll(r.source)} ${r.category}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: r.id,
        type: 'reminder',
        title: primaryText(r.title),
        description: primaryText(r.content).slice(0, 160),
        href: `/reminder/${r.id}`,
        score,
      });
    }
  }

  for (const k of knowledgeData) {
    const blob = `${textAll(k.title)} ${textAll(k.amharicText)} ${k.arabicText || ''} ${textAll(k.reference)} ${k.category}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: k.id,
        type: 'knowledge',
        title: primaryText(k.title) || primaryText(k.reference),
        description: primaryText(k.amharicText).slice(0, 160),
        href: `/knowledge#${k.id}`,
        score,
      });
    }
  }

  for (const s of sahabahData) {
    const blob = `${textAll(s.name)} ${textAll(s.title)} ${textAll(s.shortDescription)} ${s.slug}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: s.slug,
        type: 'sahabah',
        title: primaryText(s.name),
        description: primaryText(s.shortDescription),
        href: `/sahabah/${s.slug}`,
        score,
      });
    }
  }

  for (const sp of getSpeakers()) {
    const blob = `${sp.name} ${textAll(sp.nameLocalized)} ${sp.slug}`;
    const score = scoreMatch(blob, q);
    if (score > 0) {
      results.push({
        id: sp.slug,
        type: 'speaker',
        title: sp.name,
        description: `${sp.dersIds.length} ders · ${sp.kitabSlugs.length} kitab`,
        href: `/speakers/${sp.slug}`,
        score,
      });
    }
  }

  // Telegram dump — link to listing pages only (no fabricated detail routes)
  try {
    const locBlob = (t: { am?: string; en?: string; ar?: string } | undefined) =>
      t ? `${t.am || ''} ${t.en || ''} ${t.ar || ''}` : '';

    for (const a of getAudios().slice(0, 200)) {
      const blob = `${locBlob(a.title)} ${locBlob(a.description)}`;
      const score = scoreMatch(blob, q);
      if (score > 0) {
        results.push({
          id: `audio-${a.id}`,
          type: 'audio',
          title: a.title?.en || a.title?.am || 'Audio',
          description: (a.description?.en || a.description?.am || '').slice(0, 120),
          href: `/audio-lecture#${a.id}`,
          score: Math.min(score, 35),
        });
      }
    }
    for (const v of getVideos().slice(0, 150)) {
      const blob = `${locBlob(v.title)} ${locBlob(v.description)}`;
      const score = scoreMatch(blob, q);
      if (score > 0) {
        results.push({
          id: `video-${v.id}`,
          type: 'video',
          title: v.title?.en || v.title?.am || 'Video',
          description: (v.description?.en || v.description?.am || '').slice(0, 120),
          href: `/videos#${v.id}`,
          score: Math.min(score, 35),
        });
      }
    }
    for (const p of getPdfs()) {
      const blob = `${locBlob(p.title)} ${locBlob(p.description)}`;
      const score = scoreMatch(blob, q);
      if (score > 0) {
        results.push({
          id: `pdf-${p.id}`,
          type: 'pdf',
          title: p.title?.en || p.title?.am || 'PDF',
          href: `/kitab`,
          score: Math.min(score, 30),
        });
      }
    }
  } catch {
    // mediaStore optional failure should not break curated search
  }

  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return results.slice(0, limit);
}

export function getShareableSitemapPaths(): string[] {
  const paths = new Set<string>([
    '/',
    '/kitab',
    '/audio-lecture',
    '/muhadara',
    '/muhadera',
    '/reminders',
    '/knowledge',
    '/sahabah',
    '/videos',
    '/video-lecture',
    '/contact',
    '/search',
    '/speakers',
  ]);

  for (const k of kitabsData) paths.add(`/kitab/${k.slug}`);
  for (const s of sahabahData) paths.add(`/sahabah/${s.slug}`);
  for (const d of getAllDers()) paths.add(d.href);
  for (const r of remindersData) paths.add(`/reminder/${r.id}`);
  for (const m of muhadarasData) paths.add(`/muhadara/${m.id}`);
  for (const sp of getSpeakers()) paths.add(`/speakers/${sp.slug}`);

  return Array.from(paths).sort();
}
