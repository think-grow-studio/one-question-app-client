import { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';
import { cs, sp } from '@/shared/utils/responsive';

interface FloatingActionButtonProps {
  onPress: () => void;
  children: ReactNode;
  /** Whether the button sits above a tab bar. When true, adds tab bar offset. */
  aboveTabBar?: boolean;
  /** Position from edges (before tab bar / safe area offsets). */
  margin?: number;
  testID?: string;
}

const TAB_BAR_CONTENT_HEIGHT = Platform.select({ ios: 50, android: 60, default: 50 });

export function FloatingActionButton({
  onPress,
  children,
  aboveTabBar = false,
  margin,
  testID,
}: FloatingActionButtonProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const insets = useSafeAreaInsets();

  const edgeMargin = margin ?? sp(20);
  const bottomOffset =
    edgeMargin + insets.bottom + (aboveTabBar ? TAB_BAR_CONTENT_HEIGHT : 0);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.fab,
        {
          right: edgeMargin,
          bottom: bottomOffset,
          width: cs(56),
          height: cs(56),
          borderRadius: cs(28),
          backgroundColor: accent.primary,
          ...Platform.select({
            ios: {
              shadowColor: theme.color?.val ?? '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
            },
            android: {
              elevation: 6,
            },
          }),
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
