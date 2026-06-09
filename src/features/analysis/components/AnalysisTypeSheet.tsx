import { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View, BackHandler, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { useAccentColors } from '@/shared/theme';
import { sp, radius, fs, SHEET_MAX_WIDTH } from '@/shared/utils/responsive';
import type { AnalysisTypeMeta } from '../constants/analysisTypes';

interface AnalysisTypeSheetProps {
  meta: AnalysisTypeMeta | null;
  onClose: () => void;
  onStart: (meta: AnalysisTypeMeta) => void;
}

const SHEET_HEIGHT = 460;

export function AnalysisTypeSheet({ meta, onClose, onStart }: AnalysisTypeSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');

  const visible = meta != null;
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(0.5, { duration: 250 });
    }
  }, [visible, translateY, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [visible, closeSheet]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  // meta 가 null 이 되어도 닫힘 애니메이션 동안 마지막 내용을 유지하기 위해 ref 보관
  const lastMeta = useRef<AnalysisTypeMeta | null>(meta);
  if (meta) lastMeta.current = meta;
  const shown = meta ?? lastMeta.current;

  const highlights = shown
    ? (t(`types.${shown.i18nKey}.highlights`, { returnObjects: true }) as string[])
    : [];

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
      {shown && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />
          </Pressable>

          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              { backgroundColor: theme.surface?.val, paddingBottom: insets.bottom + sp(16) },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />

            <YStack gap="$3" px="$5" pt="$3" flex={1}>
              <XStack ai="center" gap="$2">
                <Text style={styles.emoji}>{shown.emoji}</Text>
                <Text variant="subheading">{t(`types.${shown.i18nKey}.name`)}</Text>
              </XStack>

              <Text variant="body" muted>
                {t(`types.${shown.i18nKey}.description`)}
              </Text>

              <Text variant="label" mt="$2">
                {t(`types.${shown.i18nKey}.highlightsTitle`)}
              </Text>
              <YStack gap="$2">
                {highlights.map((h, i) => (
                  <XStack key={i} ai="center" gap="$2">
                    <View style={[styles.dot, { backgroundColor: accent.primary }]} />
                    <Text variant="bodySmall">{h}</Text>
                  </XStack>
                ))}
              </YStack>

              <Text variant="caption" mt="$2">
                ⏱  {t('types.duration')}
              </Text>

              <YStack flex={1} jc="flex-end">
                <Button label={t('types.start')} onPress={() => onStart(shown)} />
              </YStack>
            </YStack>
          </Animated.View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: radius(24),
    borderTopRightRadius: radius(24),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: sp(12),
  },
  emoji: {
    fontSize: fs(26),
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
