import { useTheme } from 'tamagui';
import { useThemeStore } from '@/shared/stores/useThemeStore';

/**
 * 화면(스크린) 배경색 — 카드(surface)가 항상 배경 위에 떠 보이도록 모드별로 분기.
 *
 * - 다크: `background`(#1C1C1E) — 연한 카드(#2C2C2E)가 진한 배경 위에 뜸
 * - 라이트: `backgroundSoft`(#F7F9FB) — 흰 카드가 소프트 배경 위에 뜸
 *
 * Screen bgColor, 홈 헤더, 타임라인 점(도넛 안쪽) 등 "화면 배경과 같은 색"이
 * 필요한 모든 곳에서 이 훅을 사용해 색 일치를 보장한다.
 */
export function useScreenBackground(): string | undefined {
  const theme = useTheme();
  const isDark = useThemeStore((s) => s.mode) === 'dark';

  return isDark ? theme.background?.val : theme.backgroundSoft?.val;
}
