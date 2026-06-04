import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'tamagui';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { fs, sp, radius, cs, deviceValue } from '@/shared/utils/responsive';

// ===== Sizing policy =====
// 답변 카드 / 입력 영역 높이는 화면 높이에 비율을 곱해 계산. 화면 크기별로 자동 조절되며,
// 태블릿엔 절대 상한(dp) 을 두어 과도하게 늘어나는 것을 방지한다.

/** 폰: 카드 높이는 화면 높이의 75%. */
const CARD_HEIGHT_RATIO_PHONE = 0.75;
/** 태블릿: 카드 높이 비율 상한. 큰 태블릿일수록 이 비율 또는 절대 상한 중 작은 값 적용. */
const CARD_HEIGHT_RATIO_TABLET_MAX = 0.7;
/** 태블릿: 카드 높이 절대 상한 (dp). 화면이 매우 클 때 카드가 너무 길어지는 걸 방지. */
const CARD_HEIGHT_TABLET_CAP_DP = 650;
/** 답변 입력(TextInput) 최소 높이는 화면 높이의 42%. */
const INPUT_MIN_HEIGHT_RATIO = 0.42;

export function useQuestionCardStyles() {
  const theme = useTheme();
  const accent = useAccentColors();
  const isDark = useThemeStore((s) => s.mode) === 'dark';
  // 정적 Dimensions.get('window') 대신 reactive hook 사용 — 회전/Split View/폴더블에 대응.
  const { height: windowHeight } = useWindowDimensions();

  return useMemo(
    () => {
      const cardHeightRatio = deviceValue(
        CARD_HEIGHT_RATIO_PHONE,
        Math.min(CARD_HEIGHT_RATIO_TABLET_MAX, CARD_HEIGHT_TABLET_CAP_DP / windowHeight),
      );
      const cardHeight = windowHeight * cardHeightRatio;
      const inputMinHeight = windowHeight * INPUT_MIN_HEIGHT_RATIO;

      return {
        // Card container
        card: {
          backgroundColor: theme.surface?.val,
          borderRadius: radius(32),
          borderWidth: 1,
          borderColor: theme.borderColor?.val,
          paddingHorizontal: sp(32),
          paddingTop: sp(16),
          paddingBottom: sp(48),
          flexDirection: 'column' as const,
        },
        cardFull: {
          height: cardHeight,
        },
        cardMinHeight: {
          minHeight: cardHeight,
        },

        // Labels
        labelText: {
          fontSize: fs(13),
          ...getFontStyle('700'),
          color: accent.primary,
          letterSpacing: -0.2,
          textTransform: 'uppercase' as const,
        },

        // Question text
        questionText: {
          fontSize: fs(20),
          ...getFontStyle('700'),
          lineHeight: fs(24),
          color: theme.color?.val,
          letterSpacing: -0.4,
          minHeight: fs(24), // 최소 1줄
        },

        // Question description
        questionDescription: {
          fontSize: fs(14),
          lineHeight: fs(20),
          color: theme.colorMuted?.val,
          marginTop: sp(8),
        },

        // Divider
        divider: {
          height: 1,
          backgroundColor: theme.borderColor?.val,
          marginTop: sp(4),
          marginBottom: sp(16),
          marginHorizontal: sp(0),
        },

        // Answer text (for read mode)
        answerText: {
          fontSize: fs(16),
          lineHeight: fs(26),
          color: theme.color?.val,
          letterSpacing: -0.3,
        },

        // Written date
        writtenDateText: {
          fontSize: fs(11),
          ...getFontStyle('500'),
          color: theme.colorSubtle?.val,
          marginTop: sp(20),
          letterSpacing: -0.1,
        },

        // Input container (for write mode)
        // 다크: 카드 동색 + 얇은 보더(평평한 룩) / 라이트: backgroundSoft recessed(기존 룩)
        inputContainer: {
          borderRadius: radius(16),
          marginHorizontal: sp(-16),
          paddingHorizontal: sp(24),
          paddingTop: sp(16),
          paddingBottom: sp(28),
          backgroundColor: isDark ? theme.surface?.val : theme.backgroundSoft?.val,
          borderWidth: isDark ? 1 : 0,
          borderColor: theme.borderColor?.val,
        },

        // Input (for write mode)
        input: {
          fontSize: fs(16),
          lineHeight: fs(26),
          letterSpacing: -0.3,
          color: theme.color?.val,
          minHeight: inputMinHeight,
          paddingBottom: sp(28),
        },

        // Character count
        charCount: {
          position: 'absolute' as const,
          bottom: sp(10),
          right: sp(20),
          fontSize: fs(12),
          color: accent.primary,
        },

        // Reload button
        reloadButton: {
          width: cs(32),
          height: cs(32),
          borderRadius: cs(16),
          backgroundColor: theme.background?.val,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },

        // Reload count badge
        reloadCountBadge: {
          minWidth: cs(20),
          height: cs(20),
          borderRadius: cs(10),
          backgroundColor: theme.backgroundSoft?.val,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: sp(6),
        },
        reloadCountText: {
          fontSize: fs(12),
          ...getFontStyle('600'),
          color: theme.colorMuted?.val,
        },

        // Empty state
        emptyText: {
          fontSize: fs(20),
          color: theme.colorMuted?.val,
          textAlign: 'center' as const,
          letterSpacing: -0.3,
        },
        emptyButton: {
          backgroundColor: theme.surface?.val,
          paddingVertical: sp(14),
          paddingHorizontal: sp(24),
          borderRadius: radius(16),
          borderWidth: 1,
          borderColor: theme.borderColor?.val,
        },
        emptyButtonText: {
          fontSize: fs(16),
          ...getFontStyle('600'),
          color: accent.primary,
          letterSpacing: -0.2,
        },

        // Submit button
        submitButton: {
          paddingVertical: sp(14),
          borderRadius: radius(14),
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        submitButtonText: {
          fontSize: fs(15),
          ...getFontStyle('600'),
        },
        submitButtonEnabled: {
          backgroundColor: accent.primary,
        },
        submitButtonDisabled: {
          backgroundColor: theme.backgroundSoft?.val,
        },
        submitTextEnabled: {
          color: accent.textOnPrimary,
        },
        submitTextDisabled: {
          color: theme.colorMuted?.val,
        },
      };
    },
    [theme, accent, isDark, windowHeight]
  );
}
