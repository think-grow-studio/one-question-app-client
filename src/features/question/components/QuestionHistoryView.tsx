import { useRef, useEffect } from 'react';
import { StyleSheet, Pressable, View, Text, PanResponder, Dimensions, Animated } from 'react-native';
import { YStack, Paragraph, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { MailIcon } from '@/shared/icons/MailIcon';
import { CalendarIcon } from '@/shared/icons/CalendarIcon';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { useHistoryStore } from '../stores/useHistoryStore';
import { DatePickerSheet } from './DatePickerSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export function QuestionHistoryView() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('question');
  const { currentDate, setCurrentDate, getQuestionByDate, setIsDatePickerVisible, addQuestion } =
    useHistoryStore();
  const cardStyles = useQuestionCardStyles();

  const randomQuestions = t('random', { returnObjects: true }) as { question: string; description?: string }[];

  const currentItem = getQuestionByDate(currentDate);
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
              toValue: -SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(SCREEN_WIDTH);
            opacity.setValue(0);
            goToNextDay();
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // 오른쪽으로 스와이프 -> 이전 날
          isAnimating.current = true;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(-SCREEN_WIDTH);
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
    router.push('/answer');
  };

  const handleDrawRandomQuestion = () => {
    const randomItem = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
    addQuestion(currentDate, randomItem.question, randomItem.description);
  };

  const handleDrawYearAgoQuestion = () => {
    // 1년 전 날짜 계산
    const [year, month, day] = currentDate.split('-').map(Number);
    const yearAgoDate = `${year - 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const question = `${year - 1}년 ${month}월 ${day}일, 당신은 무엇을 했나요?`;
    addQuestion(currentDate, question);
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
                  <Text style={[cardStyles.labelText, { marginBottom: 12 }]}>{t('labels.question')}</Text>
                  <Text
                    style={cardStyles.questionText}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {currentItem.question}
                  </Text>
                  {currentItem.description && (
                    <Text style={cardStyles.questionDescription}>{currentItem.description}</Text>
                  )}
                </View>

                {/* Answer Section - 항상 동일한 레이아웃 유지 */}
                <View style={cardStyles.divider} />
                <View style={styles.answerSection}>
                  {currentItem.answer ? (
                    <>
                      <Text style={[cardStyles.labelText, { marginBottom: 12 }]}>{t('labels.answer')}</Text>
                      <Text style={cardStyles.answerText}>{currentItem.answer}</Text>
                      <Text style={cardStyles.writtenDateText}>
                        {t('writtenDate', { date: formatDate(currentDate) })}
                      </Text>
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
                <Pressable
                  style={cardStyles.emptyButton}
                  onPress={handleDrawRandomQuestion}
                >
                  <Text style={cardStyles.emptyButtonText}>{t('empty.drawQuestion')}</Text>
                </Pressable>
                <Pressable
                  style={cardStyles.emptyButton}
                  onPress={handleDrawYearAgoQuestion}
                >
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
  questionSection: {},
  answerSection: {
    flex: 1, // 나머지 공간 전부 차지
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
    height: SCREEN_HEIGHT * 0.75,
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
