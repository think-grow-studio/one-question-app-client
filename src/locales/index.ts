import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import Korean translations
import koCommon from './ko/common.json';
import koQuestion from './ko/question.json';
import koAnswer from './ko/answer.json';
import koSettings from './ko/settings.json';
import koAuth from './ko/auth.json';

// Import English translations
import enCommon from './en/common.json';
import enQuestion from './en/question.json';
import enAnswer from './en/answer.json';
import enSettings from './en/settings.json';
import enAuth from './en/auth.json';

const resources = {
  ko: {
    common: koCommon,
    question: koQuestion,
    answer: koAnswer,
    settings: koSettings,
    auth: koAuth,
  },
  en: {
    common: enCommon,
    question: enQuestion,
    answer: enAnswer,
    settings: enSettings,
    auth: enAuth,
  },
};

// 기기 언어 감지 (지원되지 않으면 한국어 기본값)
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'ko';
const supportedLanguages = Object.keys(resources);
const defaultLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'ko';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'ko',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React에서는 XSS 방지가 기본 제공됨
  },
  compatibilityJSON: 'v4', // i18next v23+ 에서는 v4
  react: {
    useSuspense: false, // React Native에서는 false 권장
  },
});

// 디버그: i18n 초기화 확인
if (__DEV__) {
  console.log('[i18n] Initialized with language:', i18n.language);
  console.log('[i18n] Available namespaces:', Object.keys(resources.ko));
  console.log('[i18n] Test translation (question:labels.question):', i18n.t('labels.question', { ns: 'question' }));
}

export default i18n;
