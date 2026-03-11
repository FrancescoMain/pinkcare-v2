import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import itTranslations from '../locale/it.json';

// Configurazione i18next
i18n
  .use(initReactI18next) // Plugin per React
  .init({
    resources: {
      it: {
        translation: itTranslations
      }
    },
    lng: 'it', // Lingua di default
    fallbackLng: 'it', // Lingua di fallback
    
    interpolation: {
      escapeValue: false // React già esegue l'escape di default
    },

    // Configurazioni aggiuntive
    debug: import.meta.env.DEV, // Debug solo in sviluppo
    
    // Namespace di default
    defaultNS: 'translation',
    
    // Configurazione dei separatori per le chiavi nested
    keySeparator: '.',
    nsSeparator: ':',
    
    // Configurazione per le chiavi mancanti
    saveMissing: import.meta.env.DEV,
    saveMissingTo: 'current',
    
    // Configurazione del plurale (italiano)
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Configurazione per il caricamento delle risorse
    load: 'languageOnly',
    preload: ['it'],
    
    // Configurazione della cache
    cache: {
      enabled: true
    }
  });

export default i18n;