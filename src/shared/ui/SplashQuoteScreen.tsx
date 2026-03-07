import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/useThemeStore';

interface Props {
  onFinish: () => void;
}

export function SplashQuoteScreen({ onFinish }: Props) {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

  const quotes = t('splash.quotes', { returnObjects: true }) as string[];
  const [quoteIdx] = useState(() => Math.floor(Math.random() * quotes.length));
  const quote = quotes[quoteIdx];

  const isDark = mode === 'dark' || systemScheme === 'dark';
  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const quoteColor = isDark ? '#EBEBF5' : '#3C3C43';
  const logo = isDark
    ? require('../../../assets/one-question-dark.png')
    : require('../../../assets/one-question-light.png');

  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      withDelay(
        3000,
        withTiming(0, { duration: 1000, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onFinish)();
        })
      )
    );
    return () => cancelAnimation(opacity);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.centerContent, animatedStyle]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={styles.quoteContainer}>
          <Text style={[styles.quoteText, { color: quoteColor }]}>
            {`"${quote}"`}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  quoteContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
