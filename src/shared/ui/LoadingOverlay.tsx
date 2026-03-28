import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from 'tamagui';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { fs, sp, radius, deviceValue } from '@/shared/utils/responsive';

export type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
  description?: string;
  indicatorSize?: 'small' | 'large';
};

/**
 * Fullscreen blocking loading overlay aligned with the app's design tokens.
 */
export const LoadingOverlay = memo(function LoadingOverlay({
  visible,
  message,
  description,
  indicatorSize = 'large',
}: LoadingOverlayProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const responsiveStyles = useMemo(
    () => ({
      card: {
        borderRadius: radius(24),
        minWidth: deviceValue(260, 320),
        maxWidth: deviceValue(320, 420),
        paddingVertical: sp(28),
        paddingHorizontal: sp(32),
      },
      message: {
        fontSize: fs(16),
        marginTop: sp(18),
      },
      description: {
        fontSize: fs(14),
        marginTop: sp(8),
      },
    }),
    []
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            responsiveStyles.card,
            { backgroundColor: theme.surface?.val },
          ]}
        >
          <ActivityIndicator size={indicatorSize} color={accent.primary} />
          {message ? (
            <Text
              style={[
                styles.message,
                responsiveStyles.message,
                { color: theme.color?.val },
              ]}
            >
              {message}
            </Text>
          ) : null}
          {description ? (
            <Text
              style={[
                styles.description,
                responsiveStyles.description,
                { color: theme.colorMuted?.val },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  message: {
    ...getFontStyle('600'),
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
