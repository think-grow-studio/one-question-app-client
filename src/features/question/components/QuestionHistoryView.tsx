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
import { useThrottledCallback } from '@/shared/hooks/useThrottledCallback';
import { useDatePickerStore } from '../stores/useDatePickerStore';
import { useSlideDirectionStore } from '../stores/useSlideDirectionStore';
import { useHomeViewStore } from '../stores/useHomeViewStore';
import { ViewToggle } from './ViewToggle';
import { HomeTimelineView } from './HomeTimelineView';
import { useDailyHistory, usePrefetchTimeline, questionQueryKeys } from '../hooks/queries/useQuestionQueries';
import { useServeDailyQuestion, useReloadQuestion } from '../hooks/mutations/useQuestionMutations';
import { useMemberMe, useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { MemberPermission, ApiErrorResponse } from '@/shared/types/api';
import { useInterstitialAd } from '@/features/admob/hooks/useInterstitialAd';
import { useQueryClient } from '@tanstack/react-query';
import { DatePickerSheet } from './DatePickerSheet';
import { ReloadOptionSheet } from '@/features/answer/components/ReloadOptionSheet';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors, useScreenBackground } from '@/shared/theme';
import { formatLocalDate } from '@/shared/utils/date';
import { SCREEN, sp, cs, fs } from '@/shared/utils/responsive';
import { canReloadQuestion, getReloadCountDisplay } from '../constants/limits';
import { logEvent, AnalyticsEvents } from '@/services/firebase';
import { QuestionLikeButton } from './QuestionLikeButton';

const SWIPE_THRESHOLD = SCREEN.width * 0.2; // 20% - 더 쉽게 넘어가도록 조정 (이전: 0.3)

const getTodayDateString = () => formatLocalDate();

export const QuestionHistoryView = memo(function QuestionHistoryView() {
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['question', 'common', 'answer']);
  const { currentDate, setCurrentDate, setIsDatePickerVisible } = useDatePickerStore();
  const { direction, setDirectionForNextDay, setDirectionForPreviousDay } = useSlideDirectionStore();
  const { view, setView } = useHomeViewStore();
  const screenBg = useScreenBackground();

  // 타임라인 lazy keep-alive: 최초로 타임라인을 연 뒤부터는 unmount하지 않고
  // display로만 숨김 → 카드↔타임라인 토글 시 스크롤 위치 유지
  const [isTimelineMounted, setIsTimelineMounted] = useState(view === 'timeline');
  useEffect(() => {
    if (view === 'timeline') {
      setIsTimelineMounted(true);
    }
  }, [view]);

  // 타임라인 1페이지 백그라운드 선로딩 — 최초 토글도 스피너 없이 즉시 표시
  usePrefetchTimeline();
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
    isError: isHistoryError,
    isFetching: isHistoryFetching,
    error: historyError,
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
  const { showAdAndWait: requestPastQuestionAd } = useInterstitialAd('interstitialPastQuestion');
  const { showAdAndWait: requestReloadAd } = useInterstitialAd('interstitialReload');

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

  // Query 에러: 캐시 데이터가 없고, fetching 중도 아닐 때만 에러 UI 표시
  // (캐시 있는데 백그라운드 refetch 실패 시 캐시 데이터 유지)
  const isQueryError = isHistoryError && !isHistoryFetching && !currentHistory;
  // Mutation 에러: 사용자 직접 액션 실패 → 항상 에러 UI
  const isMutationError = serveDailyQuestionMutation.isError;
  const isError = isQueryError || isMutationError;

  const currentError = (historyError ?? serveDailyQuestionMutation.error) as ApiErrorResponse | null;
  const isNetworkError = !currentError || (currentError as ApiErrorResponse).status === 0;
  const reloadCount = currentItem?.reloadCount ?? 0;
  const candidates = currentHistory?.question?.candidates ?? [];

  // Permission 정보 가져오기
  const memberPermission = member?.permission ?? MemberPermission.FREE;
  const reloadInfo = getReloadCountDisplay(reloadCount, memberPermission);
  const canReload = canReloadQuestion(reloadCount, memberPermission);
  const todayStr = useMemo(() => getTodayDateString(), []);
  const isViewingPastDate = currentDate < todayStr;
  const shouldGateRandomQuestion = memberPermission === MemberPermission.FREE && isViewingPastDate;
  const shouldGateReloadQuestion = memberPermission === MemberPermission.FREE;
  const isAdFreeMember = useIsAdFreeMember();

  const { showAd } = useInterstitialAd('interstitialSwipe');

  const swipeCountRef = useRef(0);
  const isAdFreeMemberRef = useRef(isAdFreeMember);
  const showAdRef = useRef(showAd);

  useEffect(() => { isAdFreeMemberRef.current = isAdFreeMember; }, [isAdFreeMember]);
  useEffect(() => { showAdRef.current = showAd; }, [showAd]);

  const maybeShowSwipeAdRef = useRef(() => {
    if (isAdFreeMemberRef.current) return;
    swipeCountRef.current += 1;
    if (swipeCountRef.current % 20 === 0) {
      showAdRef.current();
    }
  });

  const isFirstDateRender = useRef(true);
  useEffect(() => {
    if (isFirstDateRender.current) {
      isFirstDateRender.current = false;
      return;
    }
    maybeShowSwipeAdRef.current();
  }, [currentDate]);

  // Analytics: 질문 조회
  useEffect(() => {
    if (currentHistory?.question) {
      logEvent(AnalyticsEvents.QUESTION_VIEW, {
        date: currentDate,
        question_id: currentHistory.question.dailyQuestionId,
        has_answer: !!currentHistory.answer,
      });
    }
  }, [currentHistory, currentDate]);

  const runRewardedAction = useCallback(
    async (action: 'random' | 'reload') => {
      const requiresReward = action === 'random' ? shouldGateRandomQuestion : shouldGateReloadQuestion;
      if (!requiresReward) {
        return true;
      }
      const showAd = action === 'random' ? requestPastQuestionAd : requestReloadAd;
      const { success } = await showAd();
      if (!success) {
        console.warn('[QuestionHistoryView] Rewarded ad was not completed.');
      }
      return success;
    },
    [requestPastQuestionAd, requestReloadAd, shouldGateRandomQuestion, shouldGateReloadQuestion]
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
    const prevDateStr = formatLocalDate(prevDate);

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
    const prevDateStr = formatLocalDate(prevDate);

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
    const nextDateStr = formatLocalDate(nextDate);

    // 오늘 날짜를 넘어가지 못하게 제한
    const todayStr = formatLocalDate();

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
          const todayStr = formatLocalDate();

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

  const handleGoToAnswer = useThrottledCallback(() => {
    if (!currentItem) return;
    router.push({
      pathname: '/answer',
      params: {
        date: currentDate,
        question: currentItem.question,
        description: currentItem.description || '',
      },
    });
  }, 500);

  const handleDrawRandomQuestion = useThrottledCallback(() => {
    // Analytics: 오늘/과거 랜덤 질문 구분
    const isToday = currentDate === todayStr;
    const eventName = isToday
      ? AnalyticsEvents.RANDOM_QUESTION_TODAY
      : AnalyticsEvents.RANDOM_QUESTION_PAST;

    logEvent(eventName, {
      date: currentDate,
      requires_ad: shouldGateRandomQuestion,
    });

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
  }, 500);

  const handleDrawYearAgoQuestion = useCallback(() => {
    setIsAlertVisible(true);
  }, []);

  // Reload 관련 핸들러
  const handleReloadPress = useCallback(() => {
    setIsReloadSheetVisible(true);
  }, []);

  const handleRandomQuestion = useThrottledCallback(() => {
    if (!canReloadQuestion(reloadCount, memberPermission)) {
      console.warn('[QuestionHistoryView] Cannot reload: no reloads remaining');
      return;
    }

    // Analytics: 질문 새로고침 (랜덤 질문 선택)
    logEvent(AnalyticsEvents.RANDOM_QUESTION_RELOAD, {
      date: currentDate,
      reload_count: reloadCount,
      requires_ad: shouldGateReloadQuestion,
    });

    // ReloadOptionSheet의 closeSheet(afterClose) → Modal.onDismiss(iOS)/visible
    // 변화 다음 frame(Android)에서 이 콜백이 실행되므로 모달 native dismiss가
    // 완료된 뒤에 광고 ViewController가 present됨. (transition 충돌 방지)
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
  }, 500);

  const handlePastQuestion = useCallback(() => {
    // Analytics: 과거 질문 클릭 (준비 중)
    logEvent(AnalyticsEvents.PAST_QUESTION_CLICK, {
      date: currentDate,
    });
    setIsAlertVisible(true);
  }, [currentDate]);

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
  }, [currentItem, currentDate, currentHistory, router]);

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
              {isNetworkError ? t('common:errors.networkError') : t('common:errors.serverError')}
            </Text>
            <Text style={[cardStyles.questionDescription, { textAlign: 'center', color: theme.colorMuted?.val }]}>
              {isNetworkError ? t('common:errors.networkErrorDesc') : t('common:errors.serverErrorDesc')}
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
              <XStack ai="center" jc="space-between" mb="$2" style={styles.questionHeader}>
                <QuestionLikeButton
                  questionId={currentHistory!.question!.questionId}
                  date={currentHistory!.date}
                  initialLiked={currentHistory!.question!.liked}
                />
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
                      disabled={(candidates.length === 0 && !canReload) || reloadMutation.isPending}
                    >
                      <ReloadIcon
                        size={18}
                        color={canReload ? accent.primary : theme.colorMuted?.val}
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
                <Text style={[cardStyles.questionText, { color: accent.primary }]}>Q. </Text>
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
                    <Text style={[cardStyles.writtenDateText, { marginTop: 0 }]}>
                      {t('writtenDate', { date: currentItem.answeredAt ? formatDate(currentItem.answeredAt.split('T')[0]) : formatDate(currentDate) })}
                    </Text>
                    <Pressable onPress={handleEditAnswer} style={styles.editButton} hitSlop={8}>
                      <EditIcon size={14} color={accent.primary} />
                      <Text style={[styles.editButtonText, { color: accent.primary }]}>
                        {t('actions.edit')}
                      </Text>
                    </Pressable>
                  </XStack>
                  <ScrollView
                    style={styles.answerScroll}
                    contentContainerStyle={styles.answerScrollContent}
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                  >
                    <Text
                      style={cardStyles.answerText}
                      {...(Platform.OS === 'android' && {
                        android_hyphenationFrequency: 'none',
                        textBreakStrategy: 'simple',
                      })}
                      {...(Platform.OS === 'ios' && { lineBreakStrategyIOS: 'hangul-word' })}
                    >
                      {currentItem.answer}
                    </Text>
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
          >
            <XStack ai="center" gap="$2">
              <Text style={cardStyles.emptyButtonText}>{t('empty.drawQuestion')}</Text>
              {shouldGateRandomQuestion && <AdBadge size="compact" />}
            </XStack>
          </Pressable>
          <Pressable style={cardStyles.emptyButton} onPress={handleDrawYearAgoQuestion}>
            <Text style={cardStyles.emptyButtonText}>{t('empty.yearAgo')}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const isTimeline = view === 'timeline';

  return (
    <YStack flex={1}>
      {/* Header - Title + ViewToggle + Calendar (양 뷰 공통) */}
      <View
        style={[
          styles.header,
          {
            // 화면 배경과 동일 — useScreenBackground로 Screen bgColor와 일치 보장
            backgroundColor: screenBg,
            borderBottomColor: theme.borderColor?.val,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.color?.val }]} numberOfLines={1}>
          {isTimeline ? t('timeline.title') : formatDate(currentDate)}
        </Text>
        <XStack ai="center" gap={sp(10)}>
          <ViewToggle view={view} onChange={setView} />
          <Pressable onPress={handleOpenDatePicker} hitSlop={12} style={styles.calendarButton}>
            <CalendarIcon size={24} color={accent.primary} />
          </Pressable>
        </XStack>
      </View>

      {/* 뷰 전환은 unmount 대신 display 토글 — FlashList 스크롤 위치·카드 상태 보존.
          타임라인은 최초 진입 시 1회만 lazy mount 후 keep-alive (display:none은 터치/레이아웃 제외) */}
      {isTimelineMounted && (
        <View style={[styles.viewBody, !isTimeline && styles.viewHidden]}>
          <HomeTimelineView />
        </View>
      )}

      <View style={[styles.viewBody, isTimeline && styles.viewHidden]}>
        {/* Swipeable Card - Animated.View는 항상 렌더링 */}
        <View style={[styles.cardContainer, responsiveStyles.cardContainer]}>
          <Animated.View
            style={[styles.cardWrapper, animatedCardStyle]}
            {...panResponder.panHandlers}
          >
            {renderContent()}
          </Animated.View>
        </View>

        {/* Swipe Indicator */}
        <YStack ai="center" gap="$2">
          <Paragraph fontSize="$2" color="$gray9">
            {t('actions.swipeHint')}
          </Paragraph>
        </YStack>
      </View>

      {/* Banner - 양 뷰 공통 하단 고정 */}
      <View style={[styles.bannerWrap, isAdFreeMember && styles.bannerWrapPadded]}>
        <BannerAdSlot disableSafeAreaPadding />
      </View>

      <DatePickerSheet />

      <ReloadOptionSheet
        visible={isReloadSheetVisible}
        onClose={() => setIsReloadSheetVisible(false)}
        onRandomQuestion={handleRandomQuestion}
        onPastQuestion={handlePastQuestion}
        randomRequiresAd={shouldGateReloadQuestion}
        candidates={candidates}
        date={currentDate}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingTop: sp(12),
    paddingBottom: sp(12),
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: fs(17),
    ...getFontStyle('600'),
    letterSpacing: -0.3,
    marginRight: sp(12),
  },
  calendarButton: {
    width: cs(36),
    height: cs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBody: {
    flex: 1,
  },
  viewHidden: {
    display: 'none',
  },
  bannerWrap: {
    width: '100%',
    paddingHorizontal: sp(24),
  },
  bannerWrapPadded: {
    paddingBottom: sp(8),
  },
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
    minHeight: cs(28),
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
    ...getFontStyle('500'),
  },
  noAnswerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  likeButtonContainer: {
    marginTop: 16,
    alignItems: 'center' as const,
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
