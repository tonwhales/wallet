import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import translationRU from './../assets/translations/ru.json';
// import translationDE from './assets/translations/de.json';
// import translationES from './assets/translations/es.json';
// import translationFR from './assets/translations/fr.json';
// import translationSV from './assets/translations/sv.json';

const resources = {
  ru: {
    translation: translationRU
  },
  // de: {
  //   translation: translationDE
  // },
  // es: {
  //   translation: translationES
  // },
  // fr: {
  //   translation: translationFR
  // },
  // sv: {
  //   translation: translationSV
  // }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: getLocales()[0].languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

  export default i18n;