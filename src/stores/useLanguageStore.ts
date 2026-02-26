import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/locales';

export type Language = 'ko' | 'en';

export const SUPPORTED_LANGUAGES: { code: Language; nativeLabel: string }[] = [
  { code: 'ko', nativeLabel: '한국어' },
  { code: 'en', nativeLabel: 'English' },
];

export const LANGUAGE_LOCALE_MAP: Record<Language, string> = {
  ko: 'ko-KR',
  en: 'en-US',
};

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ko',
      setLanguage: (language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state?.language) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
