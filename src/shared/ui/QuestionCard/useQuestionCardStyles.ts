import { useMemo } from 'react';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';
import { useThemeStore } from '@/stores/useThemeStore';
import { fs, sp, radius, cs, deviceValue, SCREEN } from '@/utils/responsive';

export function useQuestionCardStyles() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return useMemo(
    () => {
      // Responsive card height (using static SCREEN.height)
      const cardHeightRatio = deviceValue(0.75, Math.min(0.7, 650 / SCREEN.height));

      return {
        // Card container
        card: {
          backgroundColor: theme.surface?.val,
          borderRadius: radius(32),
          borderWidth: 1,
          borderColor: theme.borderColor?.val,
          paddingHorizontal: sp(32),
          paddingTop: sp(24),
          paddingBottom: sp(48),
          flexDirection: 'column' as const,
        },
        cardFull: {
          height: SCREEN.height * cardHeightRatio,
        },
        cardMinHeight: {
          minHeight: SCREEN.height * cardHeightRatio,
        },

        // Labels
        labelText: {
          fontSize: fs(13),
          fontWeight: '700' as const,
          color: accent.primary,
          letterSpacing: -0.2,
          textTransform: 'uppercase' as const,
        },

        // Question text
        questionText: {
          fontSize: fs(20),
          fontWeight: '700' as const,
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
          lineHeight: fs(32),
          color: theme.color?.val,
          letterSpacing: -0.3,
        },

        // Written date
        writtenDateText: {
          fontSize: fs(11),
          fontWeight: '500' as const,
          color: theme.colorSubtle?.val,
          marginTop: sp(20),
          letterSpacing: -0.1,
        },

        // Input container (for write mode)
        inputContainer: {
          borderRadius: radius(16),
          marginHorizontal: sp(-16),
          paddingHorizontal: sp(24),
          paddingTop: sp(16),
          paddingBottom: sp(18),
          backgroundColor: isDark ? theme.background?.val : theme.backgroundSoft?.val,
        },

        // Input (for write mode)
        input: {
          fontSize: fs(19),
          lineHeight: fs(32),
          letterSpacing: -0.3,
          color: theme.color?.val,
          minHeight: SCREEN.height * 0.35,
          paddingBottom: sp(28),
        },

        // Character count
        charCount: {
          position: 'absolute' as const,
          bottom: sp(10),
          right: sp(20),
          fontSize: fs(12),
          color: theme.color?.val,
        },

        // Reload button
        reloadButton: {
          width: cs(36),
          height: cs(36),
          borderRadius: cs(18),
          backgroundColor: theme.background?.val,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },

        // Reload count badge
        reloadCountBadge: {
          minWidth: cs(20),
          height: cs(20),
          borderRadius: cs(10),
          backgroundColor: accent.background,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          paddingHorizontal: sp(6),
        },
        reloadCountText: {
          fontSize: fs(12),
          fontWeight: '600' as const,
          color: accent.primary,
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
          fontWeight: '600' as const,
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
          fontWeight: '600' as const,
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
    [theme, accent, isDark]
  );
}
