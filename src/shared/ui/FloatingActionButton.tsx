import { ReactNode, useContext } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';
import { cs, fs, sp } from '@/shared/utils/responsive';

interface FloatingActionButtonProps {
  onPress: () => void;
  children?: ReactNode;
  /** Text label — renders a pill-shaped button instead of a circular icon button. */
  label?: string;
  /**
   * Set true when inside a screen that's hosted by a Bottom Tab navigator.
   * When the tab bar is non-absolute (default), React Navigation already shrinks
   * the screen area so `bottom: 0` sits exactly above the tab bar — no extra
   * offset needed. We still consume `BottomTabBarHeightContext` to re-render
   * on tab bar height changes.
   */
  aboveTabBar?: boolean;
  /** Distance from the right edge. */
  margin?: number;
  /** Gap above the tab bar / safe area. Negative values overlap. */
  bottomSpacing?: number;
  testID?: string;
}

export function FloatingActionButton({
  onPress,
  children,
  label,
  aboveTabBar = false,
  margin,
  bottomSpacing,
  testID,
}: FloatingActionButtonProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const insets = useSafeAreaInsets();
  // Touch the context so the FAB re-renders on tab bar height changes.
  useContext(BottomTabBarHeightContext);
  useWindowDimensions();

  const isPill = Boolean(label);
  const rightEdge = margin ?? sp(20);
  const verticalGap = bottomSpacing ?? sp(24);
  // Non-absolute tab bar already removes its area from the screen.
  // Only add safe-area bottom when there's no tab bar handling it for us.
  const bottomOffset = aboveTabBar ? verticalGap : verticalGap + insets.bottom;

  const buttonHeight = cs(isPill ? 44 : 56);
  const buttonRadius = cs(isPill ? 22 : 28);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.fab,
        {
          right: rightEdge,
          bottom: bottomOffset,
          height: buttonHeight,
          borderRadius: buttonRadius,
          ...(isPill
            ? { paddingHorizontal: sp(22) }
            : { width: cs(56) }),
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
      {isPill ? (
        <Text style={[styles.label, { fontSize: fs(15), color: accent.textOnPrimary }]}>{label}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
