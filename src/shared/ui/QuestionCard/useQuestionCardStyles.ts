import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function useQuestionCardStyles() {
  const theme = useTheme();
  const accent = useAccentColors();

  return useMemo(
    () => ({
      // Card container
      card: {
        backgroundColor: theme.surface?.val,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: theme.borderColor?.val,
        padding: 48,
        flexDirection: 'column' as const,
      },
      cardFull: {
        height: SCREEN_HEIGHT * 0.75,
      },
      cardMinHeight: {
        minHeight: SCREEN_HEIGHT * 0.65,
      },

      // Labels
      labelText: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: accent.primary,
        letterSpacing: -0.2,
        textTransform: 'uppercase' as const,
      },

      // Question text
      questionText: {
        fontSize: 22,
        fontWeight: '700' as const,
        lineHeight: 32,
        color: theme.color?.val,
        letterSpacing: -0.4,
      },

      // Divider
      divider: {
        height: 1,
        backgroundColor: theme.borderColor?.val,
        marginVertical: 24,
      },

      // Answer text (for read mode)
      answerText: {
        fontSize: 19,
        lineHeight: 32,
        color: theme.colorMuted?.val,
        letterSpacing: -0.3,
      },

      // Written date
      writtenDateText: {
        fontSize: 11,
        fontWeight: '500' as const,
        color: theme.colorSubtle?.val,
        marginTop: 20,
        letterSpacing: -0.1,
      },

      // Input (for write mode)
      input: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: -16,
        fontSize: 19,
        lineHeight: 32,
        letterSpacing: -0.3,
        color: theme.colorMuted?.val,
        backgroundColor: theme.backgroundSoft?.val,
        minHeight: 160,
      },

      // Character count
      charCount: {
        fontSize: 12,
        color: theme.colorMuted?.val,
        marginTop: 8,
        textAlign: 'right' as const,
      },

      // Reload button
      reloadButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.backgroundSoft?.val,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },

      // Empty state
      emptyText: {
        fontSize: 20,
        color: theme.colorMuted?.val,
        textAlign: 'center' as const,
        letterSpacing: -0.3,
      },
      emptyButton: {
        backgroundColor: theme.surface?.val,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.borderColor?.val,
      },
      emptyButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: accent.primary,
        letterSpacing: -0.2,
      },

      // Submit button
      submitButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      submitButtonText: {
        fontSize: 16,
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
    }),
    [theme, accent]
  );
}
