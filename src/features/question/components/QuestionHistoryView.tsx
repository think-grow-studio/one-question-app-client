import { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Pressable, View, Text, PanResponder, Dimensions, Animated } from 'react-native';
import { Paragraph, YStack, XStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/ui/Button';
import { MailIcon } from '@/shared/icons/MailIcon';
import { CalendarIcon } from '@/shared/icons/CalendarIcon';
import { useHistoryStore } from '../stores/useHistoryStore';
import { DatePickerSheet } from './DatePickerSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const MOCK_RANDOM_QUESTIONS = [
  '당신이 가장 행복했던 순간은 언제였나요?',
  '오늘 하루 중 가장 감사했던 일은 무엇인가요?',
  '최근에 새롭게 배운 것이 있나요?',
  '당신의 삶에서 가장 중요한 가치는 무엇인가요?',
  '요즘 가장 기대되는 일은 무엇인가요?',
  '최근에 누군가에게 고마웠던 순간이 있나요?',
];

export function QuestionHistoryView() {
  const router = useRouter();
  const theme = useTheme();
  const { currentDate, setCurrentDate, getQuestionByDate, setIsDatePickerVisible, addQuestion } =
    useHistoryStore();

  const currentItem = getQuestionByDate(currentDate);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);
  const currentDateRef = useRef(currentDate);

  // Theme-dependent styles
  const themedStyles = useMemo(
    () => ({
      questionCard: {
        backgroundColor: theme.surface?.val,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: theme.borderColor?.val,
        padding: 48,
        height: SCREEN_HEIGHT * 0.75,
        flexDirection: 'column' as const,
      },
      writtenDateText: {
        fontSize: 11,
        fontWeight: '500' as const,
        color: theme.colorSubtle?.val,
        marginTop: 20,
        letterSpacing: -0.1,
      },
      labelText: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: theme.primary?.val,
        marginBottom: 12,
        letterSpacing: -0.2,
        textTransform: 'uppercase' as const,
      },
      questionText: {
        fontSize: 22,
        fontWeight: '700' as const,
        lineHeight: 32,
        color: theme.color?.val,
        letterSpacing: -0.4,
      },
      divider: {
        height: 1,
        backgroundColor: theme.borderColor?.val,
        marginVertical: 24,
      },
      answerText: {
        fontSize: 19,
        lineHeight: 32,
        color: theme.colorMuted?.val,
        letterSpacing: -0.3,
      },
      emptyText: {
        fontSize: 20,
        color: theme.colorMuted?.val,
        textAlign: 'center' as const,
        letterSpacing: -0.3,
      },
      emptyButton: {
        backgroundColor: theme.surface?.val,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.borderColor?.val,
      },
      emptyButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.primary?.val,
        letterSpacing: -0.2,
      },
    }),
    [theme]
  );

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
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 ${weekday}요일`;
  };

  const handleOpenDatePicker = () => {
    setIsDatePickerVisible(true);
  };

  const handleGoToAnswer = () => {
    router.push('/answer');
  };

  const handleDrawRandomQuestion = () => {
    const randomQuestion = MOCK_RANDOM_QUESTIONS[Math.floor(Math.random() * MOCK_RANDOM_QUESTIONS.length)];
    addQuestion(currentDate, randomQuestion);
  };

  const handleDrawYearAgoQuestion = () => {
    // 1년 전 날짜 계산
    const [year, month, day] = currentDate.split('-').map(Number);
    const yearAgoDate = `${year - 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const question = `${year - 1}년 ${month}월 ${day}일, 당신은 무엇을 했나요?`;
    addQuestion(currentDate, question);
  };

  return (
    <YStack flex={1} pt="$4">
      {/* Header - Date & Calendar */}
      <XStack ai="center" jc="space-between" px="$5" mb="$5">
        <Paragraph fontSize="$6" fontWeight="700" color="$gray12">
          {formatDate(currentDate)}
        </Paragraph>
        <Pressable
          onPress={handleOpenDatePicker}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CalendarIcon size={32} color={theme.color?.val} />
        </Pressable>
      </XStack>

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
              <View style={themedStyles.questionCard}>
                <View style={styles.questionSection}>
                  <Text style={themedStyles.labelText}>질문</Text>
                  <Text style={themedStyles.questionText}>{currentItem.question}</Text>
                </View>

                {currentItem.answer && (
                  <>
                    <View style={themedStyles.divider} />
                    <View style={styles.answerSection}>
                      <Text style={themedStyles.labelText}>답변</Text>
                      <Text style={themedStyles.answerText}>{currentItem.answer}</Text>
                      <Text style={themedStyles.writtenDateText}>
                        작성 날짜 {formatDate(currentDate)}
                      </Text>
                    </View>
                  </>
                )}

                {!currentItem.answer && (
                  <View style={styles.buttonWrapper}>
                    <Button
                      label="답변하러 가기"
                      onPress={handleGoToAnswer}
                      accessibilityLabel="답변 작성 화면으로 이동"
                    />
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MailIcon size={140} color={theme.colorSubtle?.val} />
              <Text style={themedStyles.emptyText}>이 날의 질문이 없습니다</Text>
              <View style={styles.emptyButtonsContainer}>
                <Pressable
                  style={themedStyles.emptyButton}
                  onPress={handleDrawRandomQuestion}
                >
                  <Text style={themedStyles.emptyButtonText}>질문 뽑기</Text>
                </Pressable>
                <Pressable
                  style={themedStyles.emptyButton}
                  onPress={handleDrawYearAgoQuestion}
                >
                  <Text style={themedStyles.emptyButtonText}>1년 전 오늘</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Swipe Indicator */}
      <YStack ai="center" pb="$6">
        <Paragraph fontSize="$2" color="$gray9">
          좌우로 밀어서 날짜 이동
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
  questionSection: {
    // 질문은 내용에 맞는 최소 높이만 차지
  },
  answerSection: {
    flex: 1, // 나머지 공간 전부 차지
  },
  buttonWrapper: {
    marginTop: 40,
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
