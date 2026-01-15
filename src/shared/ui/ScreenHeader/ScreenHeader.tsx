import { ReactNode } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';

interface ScreenHeaderProps {
  title: string;
  rightIcon: ReactNode;
  onRightPress: () => void;
  rightButtonStyle?: 'plain' | 'filled';
}

export function ScreenHeader({
  title,
  rightIcon,
  onRightPress,
  rightButtonStyle = 'plain',
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <XStack ai="center" jc="space-between" px="$5" pt="$4" mb="$4">
      <Text style={[styles.title, { color: theme.color?.val }]}>
        {title}
      </Text>
      {rightButtonStyle === 'filled' ? (
        <Pressable
          onPress={onRightPress}
          hitSlop={12}
          style={[styles.filledButton, { backgroundColor: theme.backgroundSoft?.val }]}
        >
          {rightIcon}
        </Pressable>
      ) : (
        <Pressable
          onPress={onRightPress}
          hitSlop={12}
        >
          {rightIcon}
        </Pressable>
      )}
    </XStack>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  filledButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
