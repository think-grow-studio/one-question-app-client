import { config as tamaguiConfig } from '@tamagui/config/v2';
import { createTamagui } from 'tamagui';

const config = createTamagui({
  ...tamaguiConfig,
  // Customize Letter Archive color palette
  tokens: {
    ...tamaguiConfig.tokens,
    color: {
      ...tamaguiConfig.tokens?.color,
      // Letter Archive colors
      'gray1': '#FAFAFA', // Light background
      'gray2': '#F2F2F7', // Segment background
      'gray3': '#F0F0F0', // Separator
      'gray4': '#E5E5EA', // Border
      'gray5': '#D1D1D6', // Medium border
      'gray6': '#C7C7CC', // Light text
      'gray7': '#A9A9B0', // Muted text
      'gray8': '#666666', // Answer text
      'gray9': '#8E8E93', // Secondary text
      'gray10': '#8E8E93', // Subtitle
      'black': '#191919', // Primary text
      'blue10': '#007AFF', // Link/Action
    },
  },
  themes: {
    ...tamaguiConfig.themes,
    light: {
      ...tamaguiConfig.themes?.light,
      background: '#FFFFFF',
      backgroundHover: '#FAFAFA',
      color: '#191919',
      colorHover: '#000000',
      borderColor: '#E5E5EA',
      borderColorHover: '#D1D1D6',
      placeholderColor: '#A9A9B0',
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
