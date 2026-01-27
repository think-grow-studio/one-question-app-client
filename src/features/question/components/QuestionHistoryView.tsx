import { useRef, useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, Text, PanResponder, Animated, ActivityIndicator } from 'react-native';
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
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useDailyQuestion, useQuestionHistories } from '../hooks/queries/useQuestionQueries';
import { useReloadQuestion } from '../hooks/mutations/useQuestionMutations';
import { DatePickerSheet } from './DatePickerSheet';
import { ReloadOptionSheet } from '@/features/answer/components/ReloadOptionSheet';
import { SCREEN } from '@/utils/responsive';

const SWIPE_THRESHOLD = SCREEN.width * 0.3;

export function QuestionHistoryView() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(['question', 'common']);
  const { currentDate, setCurrentDate, setIsDatePickerVisible } = useHistoryStore();
  const cardStyles = useQuestionCardStyles();
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isReloadSheetVisible, setIsReloadSheetVisible] = useState(false);

  // API Hooks
  const {
    data: dailyQuestion,
    isLoading: isQuestionLoading,
    isError: isQuestionError,
    refetch: refetchQuestion,
  } = useDailyQuestion(currentDate);

  // 현재 날짜의 히스토리 데이터 (답변 정보 포함)
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuestionHistories(
    currentDate,
    'BOTH',
    1 // 현재 날짜만 가져옴
  );

  const handleRetry = () => {
    refetchQuestion();
    refetchHistory();
  };

  const reloadMutation = useReloadQuestion();

  // 현재 날짜의 히스토리에서 답변 정보 추출
  const currentHistory = historyData?.histories?.find((h) => h.date === currentDate);

  // 현재 질문/답변 데이터 (API 응답 기반)
  const currentItem = dailyQuestion
    ? {
        question: dailyQuestion.content,
        description: dailyQuestion.description,
        answer: currentHistory?.answer?.content,
        answeredAt: currentHistory?.answer?.answeredAt,
        reloadCount: dailyQuestion.changeCount,
      }
    : null;

  const isLoading = isQuestionLoading || isHistoryLoading;
  const isError = isQuestionError;
  const reloadCount = currentItem?.reloadCount ?? 0;

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);
  const currentDateRef = useRef(currentDate);

  // currentDate가 바뀔 때마다 ref 동기화
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  // 날짜 변경 시 슬라이드 인 + Fade In 애니메이션
  useEffect(() => {
    isAnimating.current = true;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimating.current = false;
    });
  }, [currentDate]);

  const goToPreviousDay = () => {
    const date = new Date(currentDateRef.current);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

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
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isAnimating.current && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // 애니메이션 중이면 무시
        if (isAnimating.current) return;
        // 스와이프 중 카드가 손가락 따라 움직임
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // 애니메이션 중이면 무시
        if (isAnimating.current) return;

        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 왼쪽으로 스와이프 -> 다음 날
          // 오늘 날짜인지 확인 (문자열 비교로 타임존 이슈 방지)
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          // 오늘 날짜면 스와이프 불가
          if (currentDateRef.current >= todayStr) {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              friction: 7,
              tension: 40,
            }).start();
            return;
          }

          isAnimating.current = true;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN.width,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(SCREEN.width);
            opacity.setValue(0);
            goToNextDay();
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // 오른쪽으로 스와이프 -> 이전 날
          isAnimating.current = true;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN.width,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(-SCREEN.width);
            opacity.setValue(0);
            goToPreviousDay();
          });
        } else {
          // 임계값 미달 -> 원위치로 스프링 애니메이션
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = t(`weekdays.${weekdayKeys[date.getDay()]}`);
    return t('dateFormat', { month, day, weekday });
  };

  const handleOpenDatePicker = () => {
    setIsDatePickerVisible(true);
  };

  const handleGoToAnswer = () => {
    if (!currentItem) return;
    router.push({
      pathname: '/answer',
      params: {
        date: currentDate,
        question: currentItem.question,
        description: currentItem.description || '',
      },
    });
  };

  const handleDrawRandomQuestion = () => {
    // TODO: 이 기능은 reload API를 사용하도록 변경
    setIsAlertVisible(true);
  };

  const handleDrawYearAgoQuestion = () => {
    setIsAlertVisible(true);
  };

  // Reload 관련 핸들러
  const handleReloadPress = () => {
    setIsReloadSheetVisible(true);
  };

  const handleRandomQuestion = () => {
    if (reloadCount > 0) {
      reloadMutation.mutate(currentDate);
    }
  };

  const handlePastQuestion = () => {
    setIsAlertVisible(true);
  };

  // 답변 수정 화면으로 이동
  const handleEditAnswer = () => {
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
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <YStack flex={1}>
        <ScreenHeader
          title={formatDate(currentDate)}
          rightIcon={<CalendarIcon size={28} color={theme.color?.val} />}
          onRightPress={handleOpenDatePicker}
          rightButtonStyle="plain"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.color?.val} />
        </View>
        <DatePickerSheet />
      </YStack>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <YStack flex={1}>
        <ScreenHeader
          title={formatDate(currentDate)}
          rightIcon={<CalendarIcon size={28} color={theme.color?.val} />}
          onRightPress={handleOpenDatePicker}
          rightButtonStyle="plain"
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error?.val }]}>
            {t('common:errors.loadFailed')}
          </Text>
          <Button
            label={t('common:buttons.retry')}
            onPress={handleRetry}
            accessibilityLabel={t('common:buttons.retry')}
          />
        </View>
        <DatePickerSheet />
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      {/* Header - Date & Calendar */}
      <ScreenHeader
        title={formatDate(currentDate)}
        rightIcon={<CalendarIcon size={28} color={theme.color?.val} />}
        onRightPress={handleOpenDatePicker}
        rightButtonStyle="plain"
      />

      {/* Swipeable Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [{ translateX }],
              opacity,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {currentItem ? (
            <View style={styles.contentWrapper}>
              <View style={[cardStyles.card, cardStyles.cardFull]}>
                <View style={styles.questionSection}>
                  <XStack ai="center" jc="space-between" mb="$3">
                    <Text style={cardStyles.labelText}>{t('labels.question')}</Text>
                    {/* 답변이 없을 때만 reload 버튼 표시 */}
                    {!currentItem.answer && (
                      <XStack ai="center" gap="$2">
                        <View style={cardStyles.reloadCountBadge}>
                          <Text style={cardStyles.reloadCountText}>{reloadCount}</Text>
                        </View>
                        <Pressable
                          onPress={handleReloadPress}
                          style={cardStyles.reloadButton}
                          hitSlop={8}
                          disabled={reloadCount === 0 || reloadMutation.isPending}
                        >
                          <ReloadIcon
                            size={18}
                            color={reloadCount > 0 ? theme.color?.val : theme.colorMuted?.val}
                          />
                        </Pressable>
                      </XStack>
                    )}
                  </XStack>
                  <Text
                    style={cardStyles.questionText}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
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
                <View style={cardStyles.divider} />
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
                      <Text style={cardStyles.answerText}>{currentItem.answer}</Text>
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
          ) : (
            <View style={styles.emptyState}>
              <MailIcon size={140} color={theme.colorSubtle?.val} />
              <Text style={cardStyles.emptyText}>{t('empty.noQuestion')}</Text>
              <View style={styles.emptyButtonsContainer}>
                <Pressable style={cardStyles.emptyButton} onPress={handleDrawRandomQuestion}>
                  <Text style={cardStyles.emptyButtonText}>{t('empty.drawQuestion')}</Text>
                </Pressable>
                <Pressable style={cardStyles.emptyButton} onPress={handleDrawYearAgoQuestion}>
                  <Text style={cardStyles.emptyButtonText}>{t('empty.yearAgo')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Swipe Indicator */}
      <YStack ai="center" pb="$6">
        <Paragraph fontSize="$2" color="$gray9">
          {t('actions.swipeHint')}
        </Paragraph>
      </YStack>

      <DatePickerSheet />

      <ReloadOptionSheet
        visible={isReloadSheetVisible}
        onClose={() => setIsReloadSheetVisible(false)}
        onRandomQuestion={handleRandomQuestion}
        onPastQuestion={handlePastQuestion}
      />

      <AlertDialog
        visible={isAlertVisible}
        title={t('common:status.preparing')}
        message={t('common:status.comingSoon')}
        buttons={[{ label: t('common:buttons.confirm'), variant: 'primary' }]}
        onClose={() => setIsAlertVisible(false)}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  questionSection: {
    height: SCREEN.height * 0.13,
  },
  answerSection: {
    flex: 1, // 나머지 공간 전부 차지
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
    gap: 32,
    height: SCREEN.height * 0.75,
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
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
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
