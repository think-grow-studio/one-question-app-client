import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { StyleSheet, Pressable, View, Text, PanResponder, ActivityIndicator, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { YStack, XStack, Paragraph, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { MailIcon } from '@/shared/icons/MailIcon';
import { CalendarIcon } from '@/shared/icons/CalendarIcon';
import { EditIcon } from '@/shared/icons/EditIcon';
import { ReloadIcon } from '@/shared/icons/ReloadIcon';
import { CloudOffIcon } from '@/shared/icons/CloudOffIcon';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { LoadingOverlay } from '@/shared/ui/LoadingOverlay';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { AdBadge } from '@/shared/ui/ads/AdBadge';
import { useDatePickerStore } from '../stores/useDatePickerStore';
import { useSlideDirectionStore } from '../stores/useSlideDirectionStore';
import { useDailyHistory, questionQueryKeys } from '../hooks/queries/useQuestionQueries';
import { useServeDailyQuestion, useReloadQuestion } from '../hooks/mutations/useQuestionMutations';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { MemberPermission } from '@/types/api';
import { shouldHideAds } from '@/features/member/constants/permissions';
import { useRewardedAdGate } from '@/features/admob/hooks/useRewardedAdGate';
import { useQueryClient } from '@tanstack/react-query';
import { DatePickerSheet } from './DatePickerSheet';
import { ReloadOptionSheet } from '@/features/answer/components/ReloadOptionSheet';
import { SCREEN, sp } from '@/utils/responsive';
import { canReloadQuestion, getReloadCountDisplay } from '../constants/limits';

const SWIPE_THRESHOLD = SCREEN.width * 0.3;

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
};

export const QuestionHistoryView = memo(function QuestionHistoryView() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(['question', 'common', 'answer']);
  const { currentDate, setCurrentDate, setIsDatePickerVisible } = useDatePickerStore();
  const { direction, setDirectionForNextDay, setDirectionForPreviousDay } = useSlideDirectionStore();
  const cardStyles = useQuestionCardStyles();
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isReloadSheetVisible, setIsReloadSheetVisible] = useState(false);
  const queryClient = useQueryClient();

  const responsiveStyles = useMemo(
    () => ({
      cardContainer: {
        paddingHorizontal: sp(24),
        paddingVertical: sp(12),
      },
      errorContainer: {
        gap: sp(32),
        paddingHorizontal: sp(24),
      },
      errorTextContainer: {
        gap: sp(8),
      },
      emptyState: {
        gap: sp(32),
      },
      emptyButtonsContainer: {
        gap: sp(12),
      },
    }),
    []
  );

  // currentDate 변경 로그
  console.log('[QuestionHistoryView] currentDate:', currentDate);

  // 현재 날짜의 질문/답변 데이터 조회 (direction에 따라 히스토리 캐싱 방향 동적 변경)
  const {
    data: currentHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
    isError: isHistoryError,
  } = useDailyHistory(currentDate, direction, {
    enabled: Boolean(currentDate),
  });

  // Mutations
  const serveDailyQuestionMutation = useServeDailyQuestion();
  const reloadMutation = useReloadQuestion();

  const handleRetry = useCallback(() => {
    // 1. 뮤테이션 에러 상태 초기화
    serveDailyQuestionMutation.reset();

    // 2. 쿼리 무효화 및 자동 refetch (에러 상태도 함께 클리어됨)
    queryClient.invalidateQueries({
      queryKey: questionQueryKeys.daily(currentDate),
      exact: true
    });
  }, [queryClient, currentDate, serveDailyQuestionMutation]);

  // 회원 정보 조회 (cycleStartDate 제한용)
  const { data: member } = useMemberMe();
  const { requestReward, isLoading: isAdLoading } = useRewardedAdGate();

  // 현재 질문/답변 데이터 (히스토리 기반)
  const currentItem = currentHistory?.question
    ? {
        question: currentHistory.question.content,
        description: currentHistory.question.description,
        answer: currentHistory.answer?.content,
        answeredAt: currentHistory.answer?.answeredAt,
        reloadCount: currentHistory.question.changeCount,
      }
    : null;

  // 히스토리 로딩 중이거나, 랜덤질문 요청 중일 때 로딩 표시
  const isLoading = isHistoryLoading || serveDailyQuestionMutation.isPending;
  const isError = isHistoryError || serveDailyQuestionMutation.isError;
  const reloadCount = currentItem?.reloadCount ?? 0;

  // Permission 정보 가져오기
  const memberPermission = member?.permission ?? MemberPermission.FREE;
  const reloadInfo = getReloadCountDisplay(reloadCount, memberPermission);
  const canReload = canReloadQuestion(reloadCount, memberPermission);
  const todayStr = useMemo(() => getTodayDateString(), []);
  const isViewingPastDate = currentDate < todayStr;
  const shouldGateRandomQuestion = memberPermission === MemberPermission.FREE && isViewingPastDate;
  const shouldGateReloadQuestion = memberPermission === MemberPermission.FREE;
  const isAdFreeMember = shouldHideAds(memberPermission);

  const runRewardedAction = useCallback(
    async (action: 'random' | 'reload') => {
      const requiresReward = action === 'random' ? shouldGateRandomQuestion : shouldGateReloadQuestion;
      if (!requiresReward) {
        return true;
      }
      const { success } = await requestReward();
      if (!success) {
        console.warn('[QuestionHistoryView] Rewarded ad was not completed.');
      }
      return success;
    },
    [requestReward, shouldGateRandomQuestion, shouldGateReloadQuestion]
  );

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isAnimating = useRef(false);
  const currentDateRef = useRef(currentDate);
  const memberCycleStartDateRef = useRef(member?.cycleStartDate);
  const canGoToPreviousDayRef = useRef<() => boolean>(() => true);

  // currentDate가 바뀔 때마다 ref 동기화
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  // member.cycleStartDate가 바뀔 때마다 ref 동기화
  useEffect(() => {
    memberCycleStartDateRef.current = member?.cycleStartDate;
  }, [member?.cycleStartDate]);

  // 날짜 변경 시 슬라이드 인 + Fade In 애니메이션
  useEffect(() => {
    isAnimating.current = true;
    const finishAnimation = () => {
      isAnimating.current = false;
    };
    translateX.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(finishAnimation)();
      }
    });
    opacity.value = withTiming(1, { duration: 250 });
  }, [currentDate, translateX, opacity]);

  const goToPreviousDay = () => {
    const cycleStartDate = memberCycleStartDateRef.current;

    // cycleStartDate가 없으면 (로드 중이거나 없음) 이전으로 이동 불가
    if (!cycleStartDate) {
      // 애니메이션 값 원복
      translateX.value = 0;
      opacity.value = 1;
      isAnimating.current = false;
      return;
    }

    const [year, month, day] = currentDateRef.current.split('-').map(Number);
    const prevDate = new Date(year, month - 1, day - 1);
    const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

    // cycleStartDate 이전으로 이동 불가
    if (prevDateStr < cycleStartDate) {
      // 애니메이션 값 원복
      translateX.value = 0;
      opacity.value = 1;
      isAnimating.current = false;
      return;
    }

    setCurrentDate(prevDateStr);
  };

  const canGoToPreviousDay = () => {
    const cycleStartDate = memberCycleStartDateRef.current;

    // cycleStartDate가 없으면 (로드 중이거나 없음) 이전으로 이동 불가
    if (!cycleStartDate) {
      return false;
    }

    const [year, month, day] = currentDateRef.current.split('-').map(Number);
    const prevDate = new Date(year, month - 1, day - 1);
    const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

    if (prevDateStr < cycleStartDate) {
      return false;
    }
    return true;
  };

  // canGoToPreviousDay 함수를 ref에 저장 (PanResponder 클로저 문제 해결)
  canGoToPreviousDayRef.current = canGoToPreviousDay;

  const goToNextDay = () => {
    // 현재 날짜 문자열에서 다음 날 계산
    const [year, month, day] = currentDateRef.current.split('-').map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

    // 오늘 날짜를 넘어가지 못하게 제한
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (nextDateStr <= todayStr) {
      setCurrentDate(nextDateStr);
    } else {
      // 오늘 이후로 이동 불가 - 애니메이션 값 원복
      translateX.value = 0;
      opacity.value = 1;
      isAnimating.current = false;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 가로 이동이 세로보다 클 때만 스와이프로 인식 (세로 스크롤 허용)
        return !isAnimating.current && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // 애니메이션 중이면 무시
        if (isAnimating.current) return;
        // 스와이프 중 카드가 손가락 따라 움직임
        translateX.value = gestureState.dx;
      },
      onPanResponderRelease: (_, gestureState) => {
        // 애니메이션 중이면 무시
        if (isAnimating.current) return;

        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 왼쪽으로 스와이프 -> 다음 날 (미래로)
          // 오늘 날짜인지 확인 (문자열 비교로 타임존 이슈 방지)
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          // 오늘 날짜면 스와이프 불가
          if (currentDateRef.current >= todayStr) {
            translateX.value = withTiming(0, { duration: 150 });
            return;
          }

          isAnimating.current = true;
          const handleNextDayComplete = () => {
            translateX.value = SCREEN.width;
            opacity.value = 0;
            goToNextDay();
            setDirectionForNextDay();
          };
          translateX.value = withTiming(-SCREEN.width, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(handleNextDayComplete)();
            }
          });
          opacity.value = withTiming(0, { duration: 150 });
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // 오른쪽으로 스와이프 -> 이전 날 (과거로)
          // joinedDate 이전으로 이동 불가
          if (!canGoToPreviousDayRef.current()) {
            translateX.value = withTiming(0, { duration: 150 });
            return;
          }

          isAnimating.current = true;
          const handlePreviousDayComplete = () => {
            translateX.value = -SCREEN.width;
            opacity.value = 0;
            goToPreviousDay();
            setDirectionForPreviousDay();
          };
          translateX.value = withTiming(SCREEN.width, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(handlePreviousDayComplete)();
            }
          });
          opacity.value = withTiming(0, { duration: 150 });
        } else {
          // 임계값 미달 -> 원위치로 직선 애니메이션
          translateX.value = withTiming(0, { duration: 150 });
        }
      },
    })
  ).current;

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = t(`weekdays.${weekdayKeys[date.getDay()]}`);
    return t('dateFormat', { month, day, weekday });
  }, [t]);

  const handleOpenDatePicker = useCallback(() => {
    setIsDatePickerVisible(true);
  }, [setIsDatePickerVisible]);

  const handleGoToAnswer = useCallback(() => {
    if (!currentItem) return;
    router.push({
      pathname: '/answer',
      params: {
        date: currentDate,
        question: currentItem.question,
        description: currentItem.description || '',
      },
    });
  }, [currentItem, currentDate, router]);

  const handleDrawRandomQuestion = useCallback(() => {
    runRewardedAction('random')
      .then((allowed) => {
        if (!allowed) {
          return;
        }
        serveDailyQuestionMutation.mutate(currentDate);
      })
      .catch((error) => {
        console.warn('[QuestionHistoryView] Rewarded action failed', error);
      });
  }, [runRewardedAction, serveDailyQuestionMutation, currentDate]);

  const handleDrawYearAgoQuestion = useCallback(() => {
    setIsAlertVisible(true);
  }, []);

  // Reload 관련 핸들러
  const handleReloadPress = useCallback(() => {
    setIsReloadSheetVisible(true);
  }, []);

  const handleRandomQuestion = useCallback(() => {
    if (!canReloadQuestion(reloadCount, memberPermission)) {
      console.warn('[QuestionHistoryView] Cannot reload: no reloads remaining');
      return;
    }

    runRewardedAction('reload')
      .then((allowed) => {
        if (!allowed) {
          return;
        }

        reloadMutation.mutate(currentDate, {
          onSuccess: () => {
            setIsReloadSheetVisible(false);
          },
        });
      })
      .catch((error) => {
        console.warn('[QuestionHistoryView] Rewarded reload failed', error);
      });
  }, [reloadCount, memberPermission, reloadMutation, currentDate, runRewardedAction]);

  const handlePastQuestion = useCallback(() => {
    setIsAlertVisible(true);
  }, []);

  // 답변 수정 화면으로 이동
  const handleEditAnswer = useCallback(() => {
    if (!currentItem?.answer) return;

    router.push({
      pathname: '/answer',
      params: {
        mode: 'edit',
        date: currentDate,
        question: currentItem.question,
        description: currentItem.description || '',
        existingAnswer: currentItem.answer,
      },
    });
  }, [currentItem, currentDate, router]);

  // 내부 콘텐츠 렌더링 함수
  const renderContent = () => {
    // 로딩 상태
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.color?.val} />
        </View>
      );
    }

    // 에러 상태
    if (isError) {
      return (
        <View style={[styles.errorContainer, responsiveStyles.errorContainer]}>
          <CloudOffIcon size={140} color={theme.colorSubtle?.val} />
          <View style={[styles.errorTextContainer, responsiveStyles.errorTextContainer]}>
            <Text style={[cardStyles.emptyText, { marginBottom: 8 }]}>
              {t('common:errors.networkError')}
            </Text>
            <Text style={[cardStyles.questionDescription, { textAlign: 'center', color: theme.colorMuted?.val }]}>
              {t('common:errors.networkErrorDesc')}
            </Text>
          </View>
          <Pressable style={cardStyles.emptyButton} onPress={handleRetry}>
            <Text style={cardStyles.emptyButtonText}>{t('common:buttons.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    // 정상 상태 - 질문이 있는 경우
    if (currentItem) {
      return (
        <View style={styles.contentWrapper}>
          <View style={[cardStyles.card, cardStyles.cardFull]}>
            <View style={styles.questionSection}>
              <XStack ai="center" jc="space-between" mb="$3" style={styles.questionHeader}>
                <Text style={cardStyles.labelText}>{t('labels.question')}</Text>
                {/* 답변이 없을 때만 reload 버튼 표시 */}
                {!currentItem.answer && (
                  <XStack ai="center" gap="$2">
                    <View style={cardStyles.reloadCountBadge}>
                      <Text style={cardStyles.reloadCountText}>
                        {reloadInfo.remaining}/{reloadInfo.max}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleReloadPress}
                      style={cardStyles.reloadButton}
                      hitSlop={8}
                      disabled={!canReload || reloadMutation.isPending}
                    >
                      <ReloadIcon
                        size={18}
                        color={canReload ? theme.color?.val : theme.colorMuted?.val}
                      />
                    </Pressable>
                  </XStack>
                )}
              </XStack>
              <Text
                style={cardStyles.questionText}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                {...(Platform.OS === 'android' && { android_hyphenationFrequency: 'none' })}
                {...(Platform.OS === 'ios' && { lineBreakMode: 'tail' })}
              >
                {currentItem.question}
              </Text>
              {currentItem.description && (
                <Text
                  style={cardStyles.questionDescription}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {currentItem.description}
                </Text>
              )}
            </View>

            {/* Answer Section - 항상 동일한 레이아웃 유지 */}
            <View style={[cardStyles.divider, !currentItem.description && { marginTop: sp(16) }]} />
            <View style={styles.answerSection}>
              {currentItem.answer ? (
                <>
                  <XStack ai="center" jc="space-between" mb="$2">
                    <Text style={cardStyles.labelText}>{t('labels.answer')}</Text>
                    <Pressable onPress={handleEditAnswer} style={styles.editButton} hitSlop={8}>
                      <EditIcon size={14} color={theme.colorMuted?.val} />
                      <Text style={[styles.editButtonText, { color: theme.colorMuted?.val }]}>
                        {t('actions.edit')}
                      </Text>
                    </Pressable>
                  </XStack>
                  <Text style={[cardStyles.writtenDateText, { marginTop: 0, marginBottom: 12 }]}>
                    {t('writtenDate', { date: currentItem.answeredAt ? formatDate(currentItem.answeredAt.split('T')[0]) : formatDate(currentDate) })}
                  </Text>
                  <ScrollView
                    style={styles.answerScroll}
                    contentContainerStyle={styles.answerScrollContent}
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                  >
                    <Text style={cardStyles.answerText}>{currentItem.answer}</Text>
                  </ScrollView>
                </>
              ) : (
                <View style={styles.noAnswerContainer}>
                  <Button
                    label={t('actions.goToAnswer')}
                    onPress={handleGoToAnswer}
                    accessibilityLabel={t('actions.goToAnswer')}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }

    // 정상 상태 - 질문이 없는 경우 (빈 상태)
    return (
      <View style={[styles.emptyState, responsiveStyles.emptyState]}>
        <MailIcon size={140} color={theme.colorSubtle?.val} />
        <Text style={cardStyles.emptyText}>{t('empty.noQuestion')}</Text>
        <View style={[styles.emptyButtonsContainer, responsiveStyles.emptyButtonsContainer]}>
          <Pressable
            style={cardStyles.emptyButton}
            onPress={handleDrawRandomQuestion}
            disabled={isAdLoading}
          >
            <XStack ai="center" gap="$2">
              {isAdLoading && shouldGateRandomQuestion ? (
                <ActivityIndicator size="small" color={theme.color?.val} />
              ) : (
                <>
                  <Text style={cardStyles.emptyButtonText}>{t('empty.drawQuestion')}</Text>
                  {shouldGateRandomQuestion && <AdBadge size="compact" />}
                </>
              )}
            </XStack>
          </Pressable>
          <Pressable style={cardStyles.emptyButton} onPress={handleDrawYearAgoQuestion}>
            <Text style={cardStyles.emptyButtonText}>{t('empty.yearAgo')}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <YStack flex={1}>
      {/* Header - Date & Calendar */}
      <ScreenHeader
        title={formatDate(currentDate)}
        rightIcon={<CalendarIcon size={28} color={theme.color?.val} />}
        onRightPress={handleOpenDatePicker}
        rightButtonStyle="plain"
      />

      {/* Swipeable Card - Animated.View는 항상 렌더링 */}
      <View style={[styles.cardContainer, responsiveStyles.cardContainer]}>
        <Animated.View
          style={[styles.cardWrapper, animatedCardStyle]}
          {...panResponder.panHandlers}
        >
          {renderContent()}
        </Animated.View>
      </View>

      {/* Swipe Indicator + Banner */}
      <YStack ai="center" gap="$2" pb={isAdFreeMember ? "$2" : "$0"}>
        <Paragraph fontSize="$2" color="$gray9">
          {t('actions.swipeHint')}
        </Paragraph>
        {!isAdFreeMember && (
          <View style={{ width: '100%', paddingHorizontal: sp(24) }}>
            <BannerAdSlot disableSafeAreaPadding />
          </View>
        )}
      </YStack>

      <DatePickerSheet />

      <ReloadOptionSheet
        visible={isReloadSheetVisible}
        onClose={() => setIsReloadSheetVisible(false)}
        onRandomQuestion={handleRandomQuestion}
        onPastQuestion={handlePastQuestion}
        randomRequiresAd={shouldGateReloadQuestion}
      />

      <AlertDialog
        visible={isAlertVisible}
        title={t('common:status.preparing')}
        message={t('common:status.comingSoon')}
        buttons={[{ label: t('common:buttons.confirm'), variant: 'primary' }]}
        onClose={() => setIsAlertVisible(false)}
      />

      <LoadingOverlay
        visible={reloadMutation.isPending}
        message={t('answer:reload.randomQuestionLoading')}
      />
    </YStack>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: 600,
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
  },
  questionSection: {},
  questionHeader: {
    minHeight: 32,
  },
  answerSection: {
    flex: 1, // 나머지 공간 전부 차지
  },
  answerScroll: {
    flex: 1,
  },
  answerScrollContent: {
    flexGrow: 1,
    paddingBottom: sp(16),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noAnswerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN.height * 0.75,
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTextContainer: {
    alignItems: 'center',
  },
});
