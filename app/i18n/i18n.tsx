import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import { storagePersistence } from '../storage/storage';
import { langKey } from '../engine/state/language';

import en from './i18n_en';
import ru from './i18n_ru';
import es from './i18n_es';
import de from './i18n_de';
import fr from './i18n_fr';
import it from './i18n_it';
import pt from './i18n_pt';
import uk from './i18n_uk';

export const lagnTitles: { [key: string]: string } = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português'
}

export const langResources = {
  en: {
    translation: en
  },
  ru: {
    translation: ru
  },
  es: {
    translation: es
  },
  de: {
    translation: de
  },
  fr: {
    translation: fr
  },
  it: {
    translation: it
  },
  pt: {
    translation: pt
  },
  uk: {
    translation: uk
  }
}

export type SupportedLanguages = keyof typeof langResources;

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    resources: langResources,
    lng: storagePersistence.getString(langKey) || getLocales()[0].languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });