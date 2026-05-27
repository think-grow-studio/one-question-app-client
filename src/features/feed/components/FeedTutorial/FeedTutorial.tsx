import { useCallback, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, XStack, YStack } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { cs, deviceValue, fs, radius, sp } from '@/shared/utils/responsive';
import { useFeedTutorialStore } from '../../stores/useFeedTutorialStore';
import { TutorialStep } from './TutorialStep';
import { MockIntro } from './mockSteps/MockIntro';
import { MockDateNavigator } from './mockSteps/MockDateNavigator';
import { MockMyAnswerCard } from './mockSteps/MockMyAnswerCard';
import { MockAnswerCardNickname } from './mockSteps/MockAnswerCardNickname';
import { MockScrollAnswers } from './mockSteps/MockScrollAnswers';

interface FeedTutorialProps {
  visible: boolean;
  onClose: () => void;
}

const STEP_COUNT = 5;
const CARD_MAX_WIDTH = deviceValue(420, 520);
const CARD_HORIZONTAL_MARGIN = sp(20);
// 모든 step 페이지가 동일한 vertical extent 를 갖도록 고정.
// mock 카드의 작은 Text 들이 명시적 lineHeight 를 갖도록 정리한 뒤 기준 — 카드 2장 ×
// 2줄 답변 + title + description 2~3줄을 잘림 없이 수용.
const PAGE_HEIGHT = sp(380);

type StepKey = 'intro' | 'step1' | 'step2' | 'step3' | 'step4';
const STEP_KEYS: readonly StepKey[] = ['intro', 'step1', 'step2', 'step3', 'step4'] as const;

const STEP_MOCKS: Record<StepKey, ComponentType> = {
  intro: MockIntro,
  step1: MockDateNavigator,
  step2: MockMyAnswerCard,
  step3: MockAnswerCardNickname,
  step4: MockScrollAnswers,
};

export function FeedTutorial({ visible, onClose }: FeedTutorialProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const insets = useSafeAreaInsets();
  const mode = useThemeStore((s) => s.mode);
  const backdropColor = mode === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.5)';

  const markAsSeen = useFeedTutorialStore((s) => s.markAsSeen);

  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.min(windowWidth - CARD_HORIZONTAL_MARGIN * 2, CARD_MAX_WIDTH);

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<StepKey>>(null);

  const handleClose = useCallback(() => {
    markAsSeen();
    setIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    onClose();
  }, [markAsSeen, onClose]);

  const handleNext = useCallback(() => {
    if (index >= STEP_COUNT - 1) {
      handleClose();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true });
    setIndex(next);
  }, [index, pageWidth, handleClose]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(x / pageWidth);
      if (newIndex !== index && newIndex >= 0 && newIndex < STEP_COUNT) {
        setIndex(newIndex);
      }
    },
    [index, pageWidth],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<StepKey> | null | undefined, i: number) => ({
      length: pageWidth,
      offset: pageWidth * i,
      index: i,
    }),
    [pageWidth],
  );

  const renderItem = useCallback(
    ({ item }: { item: StepKey }) => {
      const Mock = STEP_MOCKS[item];
      // disclaimer 는 step 별 optional. 키가 없으면 defaultValue 로 빈 문자열 → 미렌더.
      const disclaimer = t(`tutorial.${item}.disclaimer`, { defaultValue: '' });
      return (
        <TutorialStep
          pageWidth={pageWidth}
          pageHeight={PAGE_HEIGHT}
          title={t(`tutorial.${item}.title`)}
          description={t(`tutorial.${item}.description`)}
          disclaimer={disclaimer || undefined}
        >
          <Mock />
        </TutorialStep>
      );
    },
    [pageWidth, t],
  );

  const dots = useMemo(() => Array.from({ length: STEP_COUNT }), []);
  const isLast = index === STEP_COUNT - 1;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {visible && (
        <>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop}>
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(100)}
                style={[styles.backdropOverlay, { backgroundColor: backdropColor }]}
              />
            </View>
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.centeredContainer,
              { paddingTop: insets.top + sp(24), paddingBottom: insets.bottom + sp(24) },
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[
                styles.card,
                {
                  width: pageWidth,
                  backgroundColor: theme.surface?.val ?? '#fff',
                },
              ]}
            >
              <XStack jc="flex-end" paddingHorizontal={sp(8)} paddingTop={sp(8)}>
                <Pressable
                  onPress={handleClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('tutorial.skipButton')}
                  style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <Text muted style={styles.skipText} {...getFontStyle('600')}>
                    {t('tutorial.skipButton')}
                  </Text>
                </Pressable>
              </XStack>

              <View style={[styles.listWrap, { height: PAGE_HEIGHT }]}>
                <FlatList
                  ref={listRef}
                  data={STEP_KEYS as StepKey[]}
                  renderItem={renderItem}
                  keyExtractor={(item) => item}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  getItemLayout={getItemLayout}
                  keyboardShouldPersistTaps="handled"
                />
              </View>

              <YStack gap={sp(16)} paddingHorizontal={sp(20)} paddingBottom={sp(20)}>
                <XStack jc="center" gap={sp(8)}>
                  {dots.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            i === index ? accent.primary : theme.borderColor?.val ?? '#d1d5db',
                          width: i === index ? cs(18) : cs(6),
                        },
                      ]}
                    />
                  ))}
                </XStack>

                <Pressable
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isLast ? t('tutorial.startButton') : t('tutorial.nextButton')
                  }
                  style={({ pressed }) => [
                    styles.nextButton,
                    {
                      backgroundColor: accent.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.nextButtonText, { color: accent.textOnPrimary }]}
                    {...getFontStyle('700')}
                  >
                    {isLast ? t('tutorial.startButton') : t('tutorial.nextButton')}
                  </Text>
                </Pressable>
              </YStack>
            </Animated.View>
          </View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
  },
  card: {
    borderRadius: radius(24),
    overflow: 'hidden',
  },
  skipButton: {
    paddingVertical: sp(6),
    paddingHorizontal: sp(8),
  },
  skipText: {
    fontSize: fs(13),
    letterSpacing: -0.2,
  },
  listWrap: {
    paddingVertical: sp(8),
  },
  dot: {
    height: cs(6),
    borderRadius: cs(3),
  },
  nextButton: {
    paddingVertical: sp(14),
    borderRadius: radius(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: fs(15),
    letterSpacing: -0.2,
  },
});
