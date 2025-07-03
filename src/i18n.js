// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your consolidated translation file
import translations from './locales/lang.json';

i18n
  .use(LanguageDetector) // Auto-detect browser language
  .use(initReactI18next) // Initialize react-i18next
  .init({
    resources: translations, // Use your consolidated JSON structure
    fallbackLng: 'en', // Fallback language
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'fintrack-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    supportedLngs: ['en', 'es', 'fr', 'de' ,'zh','hi'],
    
    ns: ['translation'],
    defaultNS: 'translation'
  });

// Set document direction for RTL languages
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;