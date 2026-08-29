import rawData from './content.json';
import { kitabsData } from './channelData';

export interface LocalizedTextObj {
  am: string;
  en: string;
  ar: string;
}

export interface MediaItem {
  id: string;
  title: LocalizedTextObj;
  description: LocalizedTextObj;
  fileUrl: string;
  type: 'video' | 'audio' | 'pdf' | 'unknown';
  category: string;
  fileSize?: string;
  date?: string;
  monthYear?: string;
  rawFilename?: string;
  childAudios?: MediaItem[];
}

const safeEncodeSegment = (segment: string): string => {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
};

// Clean and normalize file paths with safe URL segment encoding for browser fetching
const items: MediaItem[] = (rawData as any[]).map((item) => {
  let cleanUrl = item.fileUrl || '';

  if (cleanUrl && !cleanUrl.startsWith('http')) {
    // Strip leading dots or slashes
    cleanUrl = cleanUrl.replace(/^(\.\/|\/)/, '');

    // Ensure it starts with telegram_media/
    if (!cleanUrl.startsWith('telegram_media/')) {
      cleanUrl = `telegram_media/${cleanUrl}`;
    }

    // Format full absolute URL for local public server
    cleanUrl = `/${cleanUrl}`;

    // Safely encode spaces and special characters for browser fetching
    cleanUrl = cleanUrl
      .split('/')
      .map((segment: string) => safeEncodeSegment(segment))
      .join('/');
  }

  return {
    ...item,
    fileUrl: cleanUrl,
  };
});

export const getAudios = (): MediaItem[] => items.filter((item) => item.type === 'audio');
export const getMuhaderas = getAudios;
export const getVideos = (): MediaItem[] => items.filter((item) => item.type === 'video');
export const getPdfs = (): MediaItem[] => items.filter((item) => item.type === 'pdf');

export const getAudioItems = getAudios;
export const getKitabPDFs = getPdfs;

export const getContentByCategory = (category: string): MediaItem[] => {
  if (category === 'All' || category === 'ሁሉም') {
    return items;
  }
  return items.filter(
    (item) => item.category && item.category.toLowerCase() === category.toLowerCase()
  );
};

export const getByCategory = getContentByCategory;
export const getAllMediaItems = (): MediaItem[] => items;

export interface MediaGroup {
  monthYear: string;
  items: MediaItem[];
}

export const getGroupedPdfsByMonthYear = (): MediaGroup[] => {
  const pdfs = getPdfs();
  const groupsMap = new Map<string, MediaItem[]>();

  pdfs.forEach((pdf) => {
    const key = pdf.monthYear && pdf.monthYear !== 'Unknown Date' ? pdf.monthYear : 'ተጨማሪ የኪታብ ፋይሎች (Additional Kitabs)';
    
    // Find matching Kitab from kitabsData by matching title/filename
    const pdfTitleLower = (pdf.title.am || pdf.rawFilename || '').toLowerCase();
    const matchedKitab = kitabsData.find((k) => {
      const kTitle = (typeof k.title === 'string' ? k.title : k.title.am).toLowerCase();
      const kSlug = k.slug.toLowerCase();
      return (
        pdfTitleLower.includes(kSlug) ||
        kTitle.split(' ')[0].length > 3 && pdfTitleLower.includes(kTitle.split(' ')[0])
      );
    });

    const pdfWithAudios = {
      ...pdf,
      childAudios: matchedKitab
        ? matchedKitab.dersList.map((ders, index) => ({
            id: ders.id,
            title: {
              am: typeof ders.title === 'string' ? ders.title : ders.title.am,
              en: typeof ders.title === 'string' ? ders.title : ders.title.en || ders.title.am,
              ar: typeof ders.title === 'string' ? ders.title : ders.title.ar || ders.title.am,
            },
            description: {
              am: `ክፍል ${index + 1} የድምፅ ድርስ`,
              en: `Part ${index + 1} Audio Lesson`,
              ar: `الجزء ${index + 1}`,
            },
            fileUrl: ders.audioUrl,
            type: 'audio' as const,
            category: pdf.category || 'Kitab Audio',
          }))
        : [],
    };

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(pdfWithAudios);
  });

  const result: MediaGroup[] = [];
  groupsMap.forEach((groupItems, monthYear) => {
    result.push({ monthYear, items: groupItems });
  });

  return result;
};

export const getGroupedVideosByMonthYear = (): MediaGroup[] => {
  const videos = getVideos();
  const groupsMap = new Map<string, MediaItem[]>();

  videos.forEach((video) => {
    const key = video.monthYear && video.monthYear !== 'Unknown Date' ? video.monthYear : 'ተጨማሪ የቪዲዮ ፋይሎች (Additional Videos)';
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(video);
  });

  const result: MediaGroup[] = [];
  groupsMap.forEach((groupItems, monthYear) => {
    result.push({ monthYear, items: groupItems });
  });

  return result;
};

export const getGroupedAudiosByMonthYear = (): MediaGroup[] => {
  const audios = getAudios();
  const groupsMap = new Map<string, MediaItem[]>();

  audios.forEach((audio) => {
    const key = audio.monthYear && audio.monthYear !== 'Unknown Date' ? audio.monthYear : 'ተጨማሪ የድምፅ ትምህርቶች (Additional Audios)';
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(audio);
  });

  const result: MediaGroup[] = [];
  groupsMap.forEach((groupItems, monthYear) => {
    result.push({ monthYear, items: groupItems });
  });

  return result;
};
