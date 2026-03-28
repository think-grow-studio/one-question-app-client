import { useMemo } from 'react';
import { useThemeStore, getAccentColors } from '@/shared/stores/useThemeStore';

export function useAccentColors() {
  const { mode, accentColor } = useThemeStore();

  return useMemo(() => getAccentColors(mode, accentColor), [mode, accentColor]);
}
