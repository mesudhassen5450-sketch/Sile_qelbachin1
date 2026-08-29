'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: number;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
    changeLanguage?: (langCode: string) => void;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    // 1. Define global Google Translate Init Callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'am',
            includedLanguages: 'am,ar,en',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    // 2. Define global changeLanguage helper function
    window.changeLanguage = (langCode: string) => {
      const code = langCode.toLowerCase();
      
      // Update Google Translate Cookie
      const domain = window.location.hostname;
      document.cookie = `googtrans=/am/${code}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/am/${code}; path=/;`;

      // Trigger change event on hidden select box if already rendered by Google Script
      const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectEl) {
        selectEl.value = code;
        selectEl.dispatchEvent(new Event('change'));
      } else {
        // Reload page to apply cookie translation if element hasn't bound yet
        window.location.reload();
      }
    };

    // 3. Load script asynchronously if not already loaded
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div id="google_translate_element" className="hidden" style={{ display: 'none' }} />
  );
}
