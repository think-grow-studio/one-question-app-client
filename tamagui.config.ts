import { config as tamaguiConfig } from '@tamagui/config/v2';
import { createTamagui } from 'tamagui';

const config = createTamagui({
  ...tamaguiConfig,
  media: {
    // Mobile first breakpoints
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    // Device type shortcuts
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    // Orientation
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    // Handheld device detection
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
  tokens: {
    ...tamaguiConfig.tokens,
    color: {
      ...tamaguiConfig.tokens?.color,
      // Primary - Medium Blue
      primary: '#4A90E2',
      primaryPressed: '#3A7BC8',

      // Grayscale - Pastel (light to dark)
      gray1: '#F7F9FB', // backgroundSecondary
      gray2: '#EEF2F6', // systemGray5
      gray3: '#E0E6EC', // systemGray4
      gray4: '#D0D8E0', // systemGray3
      gray5: '#B8C4D0', // systemGray2
      gray6: '#A8B4C0', // systemGray
      gray7: '#7F8C8D', // textSecondary
      gray8: '#666666', // answer text
      gray9: '#2D3436', // textPrimary

      // Card pastels
      cardBlue: '#F0F7FF',
      cardPink: '#FFF5F8',
      cardMint: '#F0FFF8',
      cardLavender: '#F8F5FF',
      cardPeach: '#FFF8F0',
      cardYellow: '#FFF9C4',

      // Legacy compatibility (will be removed)
      black: '#2D3436',
      blue10: '#007AFF',
    },
  },
  themes: {
    ...tamaguiConfig.themes,
    light: {
      ...tamaguiConfig.themes?.light,
      // Backgrounds
      background: '#FFFFFF',
      backgroundHover: '#F7F9FB',
      backgroundSoft: '#F7F9FB',
      backgroundStrong: '#FFFFFF',

      // Card/Surface - elevated surfaces (cards, modals, etc.)
      surface: '#FFFFFF',
      surfaceHover: '#F7F9FB',

      // Text colors
      color: '#2D3436',
      colorHover: '#000000',
      colorMuted: '#7F8C8D',
      colorSubtle: '#A8B4C0',

      // Primary action colors
      primary: '#4A90E2',
      primaryHover: '#3A7BC8',

      // Border colors
      borderColor: '#E0E6EC',
      borderColorHover: '#D0D8E0',
      borderColorFocus: '#4A90E2',

      // Input colors
      placeholderColor: '#A8B4C0',
      inputBackground: '#F7F9FB',

      // Screen backgrounds (colored pastels)
      cardBlue: '#F0F7FF',
      cardPink: '#FFF5F8',
      cardMint: '#F0FFF8',
      cardLavender: '#F8F5FF',
      cardPeach: '#FFF8F0',

      // Semantic colors
      error: '#FF6B6B',
      errorMuted: '#FFE5E5',
    },
    dark: {
      ...tamaguiConfig.themes?.dark,
      // Backgrounds
      background: '#1C1C1E',
      backgroundHover: '#2C2C2E',
      backgroundSoft: '#2C2C2E',
      backgroundStrong: '#000000',

      // Card/Surface - elevated surfaces (cards, modals, etc.)
      surface: '#2C2C2E',
      surfaceHover: '#3C3C3E',

      // Text colors
      color: '#FFFFFF',
      colorHover: '#FFFFFF',
      colorMuted: '#ABABAB',
      colorSubtle: '#8E8E93',

      // Primary action colors
      primary: '#5BA3F5',
      primaryHover: '#4A90E2',

      // Border colors
      borderColor: '#38383A',
      borderColorHover: '#48484A',
      borderColorFocus: '#5BA3F5',

      // Input colors
      placeholderColor: '#8E8E93',
      inputBackground: '#2C2C2E',

      // Screen backgrounds (same as background in dark - no pastel tints)
      cardBlue: '#1C1C1E',
      cardPink: '#1C1C1E',
      cardMint: '#1C1C1E',
      cardLavender: '#1C1C1E',
      cardPeach: '#1C1C1E',

      // Semantic colors
      error: '#FF8A8A',
      errorMuted: '#3A2020',
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
