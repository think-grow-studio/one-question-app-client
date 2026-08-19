import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/locales';

export type Language = 'ko' | 'en';

export const SUPPORTED_LANGUAGES: { code: Language; nativeLabel: string }[] = [
  { code: 'ko', nativeLabel: '한국어' },
  { code: 'en', nativeLabel: 'English' },
];

// 하위 호환 재노출 — 실제 정의는 platform/i18n 성격이라 locales에 있다 (apiClient가
// shared/stores를 몰라도 되게 하기 위한 분리, services/CLAUDE.md 참고).
export { LANGUAGE_LOCALE_MAP } from '@/locales/localeMap';

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
