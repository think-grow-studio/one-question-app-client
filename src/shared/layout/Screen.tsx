import { ReactNode } from 'react';
import { YStack, styled, GetProps, useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

const ScreenContainer = styled(YStack, {
  name: 'Screen',
  flex: 1,
  backgroundColor: '$background',
});

const ContentContainer = styled(YStack, {
  name: 'ScreenContent',
  flex: 1,
  width: '100%',
  alignSelf: 'center',
});

type Edge = 'top' | 'bottom' | 'left' | 'right';

export type ScreenProps = GetProps<typeof ScreenContainer> & {
  children: ReactNode;
  safeArea?: boolean;
  edges?: Edge[];
  maxContentWidth?: number;
  statusBarStyle?: 'auto' | 'light' | 'dark';
  bgColor?: string;
  variant?: 'default' | 'modal';
};

export function Screen({
  children,
  safeArea = true,
  edges = ['top', 'bottom'],
  maxContentWidth = 600,
  statusBarStyle = 'auto',
  bgColor,
  variant = 'default',
  ...props
}: ScreenProps) {
  const { mode } = useThemeStore();
  const theme = useTheme();

  const barStyle =
    statusBarStyle === 'auto'
      ? mode === 'dark'
        ? 'light-content'
        : 'dark-content'
      : statusBarStyle === 'light'
        ? 'light-content'
        : 'dark-content';

  const backgroundColor = bgColor ?? theme.background?.val;
  const isModal = variant === 'modal';

  const content = (
    <ScreenContainer backgroundColor={backgroundColor} {...props}>
      <ContentContainer maxWidth={maxContentWidth}>{children}</ContentContainer>
    </ScreenContainer>
  );

  if (safeArea) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor },
          isModal && styles.modalSafeArea,
        ]}
        edges={edges}
      >
        <StatusBar barStyle={barStyle} />
        {isModal && (
          <YStack ai="center" pt="$3" pb="$2">
            <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
          </YStack>
        )}
        {content}
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle={barStyle} />
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalSafeArea: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
