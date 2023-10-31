import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import en from './i18n_en';
import ru from './i18n_ru';
import { storagePersistence } from '../storage/storage';
import { langKey } from '../engine/state/language';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: en
      },
      ru: {
        translation: ru
      }
    },
    lng: storagePersistence.getString(langKey) || getLocales()[0].languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });