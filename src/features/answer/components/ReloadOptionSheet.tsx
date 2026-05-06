import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Text, Modal, PanResponder, BackHandler, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { MailIcon } from '@/shared/icons/MailIcon';
import { PastQuestionIcon } from '@/shared/icons/PastQuestionIcon';
import { AdBadge } from '@/shared/ui/ads/AdBadge';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { fs, sp, radius, cs, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/shared/utils/responsive';
import {
  useCheckCandidateCycle,
  useSelectQuestion,
} from '@/features/question/hooks/mutations/useQuestionMutations';
import type { QuestionCandidateDomain } from '@/features/question/domain/questionDomain';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';

const DISMISS_RATIO = 0.3;

type ReloadOptionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onRandomQuestion: () => void;
  onPastQuestion: () => void;
  randomRequiresAd?: boolean;
  candidates: QuestionCandidateDomain[];
  date: string;
};

export function ReloadOptionSheet({
  visible,
  onClose,
  onRandomQuestion,
  onPastQuestion,
  randomRequiresAd = false,
  candidates,
  date,
}: ReloadOptionSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'common']);
  const isAdFreeMember = useIsAdFreeMember();
  const { mutate: selectQuestion, isPending: isSelectPending } = useSelectQuestion();
  const { mutateAsync: checkCandidateCycle, isPending: isCycleCheckPending } = useCheckCandidateCycle();

  const alert = useAlertDialog();
  const hasCandidates = candidates.length > 0;
  const SHEET_HEIGHT = SHEET_HEIGHTS.large;
  const isCandidateActionPending = isSelectPending || isCycleCheckPending;

  const isCycleCheckPendingRef = useRef(false);
  useEffect(() => {
    isCycleCheckPendingRef.current = isCycleCheckPending;
  }, [isCycleCheckPending]);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const startY = useRef(0);

  // afterClose 콜백은 네이티브 Modal dismiss 완료 후 실행해야 함
  // (모달 dismiss 전에 광고 ViewController를 present하면 iOS에서 transition
  // 충돌로 광고가 즉시 닫히고 터치 입력이 먹통이 됨).
  // - iOS: <Modal onDismiss>가 native dismiss 완료 시점을 알려줌
  // - Android: onDismiss prop 없음 → visible: true→false 변화 후 다음 frame
  //   (Android Dialog dismiss는 즉시이므로 1 frame이면 안전)
  // 매직 넘버 setTimeout 대신 native 콜백을 사용해 정확한 시점에 호출됨.
  const afterCloseRef = useRef<(() => void) | null>(null);

  const runAfterClose = useCallback(() => {
    const cb = afterCloseRef.current;
    afterCloseRef.current = null;
    cb?.();
  }, []);

  const closeSheet = useCallback((afterClose?: () => void) => {
    if (afterClose) {
      afterCloseRef.current = afterClose;
    }
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity, SHEET_HEIGHT]);

  // Android fallback: Modal.onDismiss가 없으므로 visible 변화로 dismiss 완료 추정
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // iOS는 <Modal onDismiss>로 처리
      prevVisibleRef.current = visible;
      return;
    }
    if (prevVisibleRef.current && !visible) {
      requestAnimationFrame(runAfterClose);
    }
    prevVisibleRef.current = visible;
  }, [visible, runAfterClose]);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible, openSheet]);

  // Android back button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isCycleCheckPendingRef.current) return true;
      closeSheet();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startY.current = translateY.value;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        const newValue = Math.max(0, startY.current + gestureState.dy);
        translateY.value = newValue;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCycleCheckPendingRef.current) {
          translateY.value = withTiming(0, { duration: 200 });
          return;
        }
        if (gestureState.dy > SHEET_HEIGHT * DISMISS_RATIO || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      },
    })
  ).current;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleRandomQuestion = () => {
    if (isCycleCheckPending) return;
    closeSheet(onRandomQuestion);
  };

  const handlePastQuestion = () => {
    if (isCycleCheckPending) return;
    closeSheet(onPastQuestion);
  };

  const handleBackdropPress = () => {
    if (isCycleCheckPending) return;
    closeSheet();
  };

  const handleSelectCandidate = async (candidate: QuestionCandidateDomain) => {
    if (isCandidateActionPending) return;
    if (candidate.selected) {
      closeSheet();
      return;
    }

    const confirmSelectQuestion = () => {
      closeSheet(() => {
        selectQuestion(
          { date, questionId: candidate.questionId },
          {
            onError: () => {
              alert.show({
                title: t('common:error.title'),
                message: t('answer:reload.selectError'),
              });
            },
          }
        );
      });
    };

    try {
      const cycleCheck = await checkCandidateCycle({
        date,
        questionId: candidate.questionId,
      });

      if (!cycleCheck.alreadyAssignedInCycle) {
        confirmSelectQuestion();
        return;
      }

      alert.show({
        title: t('answer:reload.cycleDuplicateTitle'),
        message: t('answer:reload.cycleDuplicateMessage', {
          dates: cycleCheck.previouslyAssignedDates.join(', '),
        }),
        buttons: [
          { label: t('common:buttons.cancel') },
          { label: t('common:buttons.confirm'), variant: 'primary', onPress: confirmSelectQuestion },
        ],
      });
    } catch {
      alert.show({
        title: t('common:error.title'),
        message: t('answer:reload.cycleCheckError'),
      });
    }
  };

  const responsiveStyles = useMemo(() => ({
    sheetContainer: {
      height: SHEET_HEIGHT,
      maxWidth: SHEET_MAX_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
      borderTopLeftRadius: radius(24),
      borderTopRightRadius: radius(24),
    },
    handleContainer: {
      paddingVertical: sp(16),
      paddingHorizontal: sp(20),
    },
    contentContainer: {
      paddingHorizontal: sp(16),
    },
    candidatesLabel: {
      fontSize: fs(13),
      marginBottom: sp(8),
    },
    candidateItem: {
      paddingVertical: sp(14),
      paddingHorizontal: sp(16),
      borderRadius: radius(16),
      marginBottom: sp(8),
    },
    candidateText: {
      fontSize: fs(15),
      flex: 1,
      lineHeight: fs(15) * 1.5,
    },
    divider: {
      marginVertical: sp(16),
    },
    title: {
      fontSize: fs(18),
      marginBottom: sp(4),
    },
    message: {
      fontSize: fs(14),
      marginBottom: sp(20),
    },
    optionButton: {
      padding: sp(16),
      borderRadius: radius(16),
    },
    optionIcon: {
      width: cs(44),
      height: cs(44),
      borderRadius: radius(12),
    },
    optionTextContainer: {
      marginLeft: sp(14),
    },
    optionTitle: {
      fontSize: fs(16),
      marginBottom: sp(2),
    },
    optionDescription: {
      fontSize: fs(13),
    },
    comingSoonBadge: {
      paddingHorizontal: sp(10),
      paddingVertical: sp(4),
      borderRadius: radius(8),
    },
    comingSoonText: {
      fontSize: fs(12),
    },
    cancelButton: {
      marginTop: sp(12),
      paddingVertical: sp(16),
      borderRadius: radius(16),
    },
    cancelText: {
      fontSize: fs(16),
    },
  }), [SHEET_HEIGHT]);

  // 주의: 여기서 visible=false일 때 return null 하지 않음.
  // 컴포넌트가 언마운트되면 <Modal>의 native dismiss 사이클이 끊겨
  // onDismiss 콜백이 발화하지 않음 (= afterClose가 실행 안됨).
  // <Modal visible={false}>로 두면 native가 정상적으로 dismiss + onDismiss 호출.

  return (
    <>
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onDismiss={runAfterClose} onRequestClose={() => { if (!isCycleCheckPending) closeSheet(); }}>
      {/* visible일 때만 자식 mount — Modal 자체는 항상 JSX에 두어 onDismiss 발화 보장.
          시트 안의 BannerAdSlot이 항상 mount되면 메인 화면 배너와 같은 unit ID로
          동시 로드되어 광고가 표시 안 되는 문제를 방지함. */}
      {visible && (<>
      {/* Backdrop */}
      <Pressable style={styles.backdropContainer} onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          responsiveStyles.sheetContainer,
          sheetStyle,
          { backgroundColor: theme.surface?.val },
        ]}
      >
        {/* Handle - Draggable area */}
        <View {...panResponder.panHandlers} style={[styles.handleContainer, responsiveStyles.handleContainer]}>
          <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, responsiveStyles.contentContainer]}>

          {/* 후보 질문 섹션 — flex:1로 남은 공간 차지, 4개 이상 시 스크롤 */}
          {hasCandidates && (
            <View style={styles.candidatesSection}>
              <Text style={[styles.candidatesLabel, responsiveStyles.candidatesLabel, { color: theme.colorMuted?.val }]}>
                {t('answer:reload.candidatesLabel')}
              </Text>
              <ScrollView
                scrollEnabled={candidates.length >= 2}
                showsVerticalScrollIndicator={candidates.length >= 2}
                style={styles.candidatesScroll}
                nestedScrollEnabled
              >
                {candidates.map((candidate) => (
                  <Pressable
                    key={`${candidate.questionId}-${candidate.receivedOrder}`}
                    onPress={() => { void handleSelectCandidate(candidate); }}
                    disabled={isCandidateActionPending}
                    style={({ pressed }) => [
                      styles.candidateItem,
                      responsiveStyles.candidateItem,
                      {
                        backgroundColor: candidate.selected
                          ? `${accent.primary}18`
                          : theme.backgroundSoft?.val ?? '#262627',
                      },
                      pressed && !candidate.selected && { opacity: 0.7 },
                      isCandidateActionPending && !candidate.selected && { opacity: 0.45 },
                    ]}
                  >
                    {candidate.selected && (
                      <View style={[styles.candidateAccentBar, { backgroundColor: accent.primary }]} />
                    )}
                    <Text
                      style={[styles.candidateText, responsiveStyles.candidateText, { color: theme.color?.val }]}
                      numberOfLines={2}
                    >
                      {candidate.content}
                    </Text>
                    <View
                      style={[
                        styles.candidateRadio,
                        candidate.selected
                          ? { backgroundColor: accent.primary }
                          : { borderWidth: 2, borderColor: theme.borderColor?.val },
                      ]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 하단 고정 섹션 — 후보 수와 관계없이 위치 고정 */}
          <View {...panResponder.panHandlers} style={styles.bottomFixedSection}>
            {hasCandidates && (
              <View style={[styles.divider, { backgroundColor: theme.borderColor?.val }]} />
            )}

            {/* Title */}
            <Text style={[styles.title, responsiveStyles.title, { color: theme.color?.val }]}>
              {t('answer:reload.title')}
            </Text>
            <Text style={[styles.message, responsiveStyles.message, { color: theme.colorMuted?.val }]}>
              {t('answer:reload.message')}
            </Text>

            {/* Options */}
            <YStack style={styles.optionsContainer}>
              {/* Random Question Option */}
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  responsiveStyles.optionButton,
                  { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
                ]}
                onPress={handleRandomQuestion}
              >
                <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: accent.primary }]}>
                  <MailIcon size={cs(22)} color={accent.textOnPrimary} />
                </View>
                <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                      {t('answer:reload.randomQuestion')}
                    </Text>
                    {randomRequiresAd && <AdBadge size="compact" />}
                  </View>
                  <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                    {t('answer:reload.randomQuestionDesc')}
                  </Text>
                </YStack>
              </Pressable>

              {/* Past Question Option */}
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  responsiveStyles.optionButton,
                  { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
                ]}
                onPress={handlePastQuestion}
              >
                <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: theme.backgroundSoft?.val }]}>
                  <PastQuestionIcon size={cs(22)} color={theme.colorMuted?.val} />
                </View>
                <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                  <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                    {t('answer:reload.pastQuestion')}
                  </Text>
                  <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                    {t('answer:reload.pastQuestionDesc')}
                  </Text>
                </YStack>
                <View style={[styles.comingSoonBadge, responsiveStyles.comingSoonBadge, { backgroundColor: theme.backgroundSoft?.val }]}>
                  <Text style={[styles.comingSoonText, responsiveStyles.comingSoonText, { color: theme.colorMuted?.val }]}>
                    {t('common:status.comingSoon')}
                  </Text>
                </View>
              </Pressable>
            </YStack>

            {/* Cancel Button */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                responsiveStyles.cancelButton,
                {
                  backgroundColor: pressed ? theme.backgroundSoft?.val : theme.background?.val,
                  borderColor: theme.borderColor?.val,
                },
              ]}
              onPress={() => { if (!isCycleCheckPending) closeSheet(); }}
            >
              <Text style={[styles.cancelText, responsiveStyles.cancelText, { color: theme.color?.val }]}>
                {t('common:buttons.cancel')}
              </Text>
            </Pressable>
            {isAdFreeMember && <View style={{ paddingBottom: insets.bottom }} />}
          </View>
        </View>

        {!isAdFreeMember && (
          <View style={{ paddingHorizontal: sp(16), paddingBottom: insets.bottom }}>
            <BannerAdSlot disableSafeAreaPadding />
          </View>
        )}
      </Animated.View>
      </>)}
    </Modal>

    <AlertDialog
      visible={alert.visible}
      title={alert.config.title}
      message={alert.config.message}
      buttons={alert.config.buttons}
      onClose={alert.hide}
    />
  </>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handleContainer: {
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  candidatesSection: {
    flex: 1,
    maxHeight: sp(250),
    marginBottom: sp(4),
  },
  candidatesScroll: {
    flex: 1,
  },
  bottomFixedSection: {
    flexShrink: 0,
  },
  candidatesLabel: {
    ...getFontStyle('600'),
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  candidateAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  candidateText: {
    flex: 1,
    ...getFontStyle('500'),
  },
  candidateRadio: {
    width: cs(18),
    height: cs(18),
    borderRadius: cs(9),
    marginLeft: sp(10),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: sp(8),
    opacity: 0.3,
  },
  title: {
    ...getFontStyle('700'),
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...getFontStyle('600'),
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  optionDescription: {},
  comingSoonBadge: {},
  comingSoonText: {
    ...getFontStyle('500'),
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    ...getFontStyle('600'),
  },
});
