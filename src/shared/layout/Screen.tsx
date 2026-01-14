import { ReactNode } from 'react';
import { YStack, styled, GetProps, useTheme } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
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
};

export function Screen({
  children,
  safeArea = true,
  edges = ['top', 'bottom'],
  maxContentWidth = 600,
  statusBarStyle = 'auto',
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

  const content = (
    <ScreenContainer {...props}>
      <ContentContainer maxWidth={maxContentWidth}>{children}</ContentContainer>
    </ScreenContainer>
  );

  if (safeArea) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background?.val,
        }}
        edges={edges}
      >
        <StatusBar barStyle={barStyle} />
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
