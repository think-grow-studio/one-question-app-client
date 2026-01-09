import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { YStack, XStack, Paragraph } from 'tamagui';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { useHistoryStore } from '../stores/useHistoryStore';
import { Button } from '@/shared/ui/Button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function DatePickerSheet() {
  const { isDatePickerVisible, setIsDatePickerVisible, history, currentDate, setCurrentDate } =
    useHistoryStore();

  // 현재 보고 있는 달 (년, 월)
  const [viewYear, setViewYear] = useState(() => {
    const [year] = currentDate.split('-').map(Number);
    return year;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const [, month] = currentDate.split('-').map(Number);
    return month - 1; // 0-indexed
  });

  // 선택한 날짜 (미리보기용) - 기본값은 현재 보고 있는 날짜
  const [previewDate, setPreviewDate] = useState<string>(currentDate);

  const handleClose = () => {
    setIsDatePickerVisible(false);
  };

  const handleNavigateToDate = () => {
    setCurrentDate(previewDate);
    handleClose();
  };

  const handleDayPress = (dateStr: string) => {
    setPreviewDate(dateStr);
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

    if (nextYear > today.getFullYear() ||
        (nextYear === today.getFullYear() && nextMonth > today.getMonth())) {
      return;
    }

    setViewMonth(nextMonth);
    setViewYear(nextYear);
  };

  // 오늘 날짜
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 다음 달 버튼 비활성화 여부
  const isNextDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getDateString = (day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getQuestionItem = (dateStr: string) => {
    return history.find((h) => h.date === dateStr) || null;
  };

  const hasAnswer = (day: number) => {
    const item = getQuestionItem(getDateString(day));
    return item?.answer ? true : false;
  };

  const hasQuestion = (day: number) => {
    return getQuestionItem(getDateString(day)) !== null;
  };

  const isFutureDate = (day: number) => {
    return getDateString(day) > todayStr;
  };

  const isSelected = (day: number) => {
    return getDateString(day) === previewDate;
  };

  const isCurrentDate = (day: number) => {
    return getDateString(day) === currentDate;
  };

  const isToday = (day: number) => {
    return getDateString(day) === todayStr;
  };

  // 미리보기 데이터
  const previewItem = getQuestionItem(previewDate);

  const formatPreviewDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}월 ${day}일 ${weekdays[date.getDay()]}요일`;
  };

  if (!isDatePickerVisible) return null;

  return (
    <Modal transparent visible={isDatePickerVisible} animationType="none">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View entering={FadeIn} style={styles.backdropOverlay} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(200)}
        style={styles.sheetContainer}
      >
        <YStack bg={colors.cardWhite} borderTopLeftRadius={24} borderTopRightRadius={24} pb="$5">
          {/* Handle */}
          <YStack ai="center" py="$4">
            <YStack width={40} height={4} bg={colors.systemGray4} borderRadius={2} />
          </YStack>

          {/* Month Navigation */}
          <XStack ai="center" jc="space-between" px="$5" pb="$4">
            <Pressable onPress={goToPrevMonth} hitSlop={12}>
              <Text style={styles.navArrow}>{'<'}</Text>
            </Pressable>
            <Paragraph fontSize={20} fontWeight="700" letterSpacing={-0.3}>
              {viewYear}년 {viewMonth + 1}월
            </Paragraph>
            <Pressable onPress={goToNextMonth} hitSlop={12} disabled={isNextDisabled}>
              <Text style={[styles.navArrow, isNextDisabled && styles.navArrowDisabled]}>{'>'}</Text>
            </Pressable>
          </XStack>

          {/* Weekday Headers */}
          <XStack px="$4" pb="$2">
            {WEEKDAYS.map((day, index) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[
                  styles.weekdayText,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}>
                  {day}
                </Text>
              </View>
            ))}
          </XStack>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null && (
                  <Pressable
                    onPress={() => !isFutureDate(day) && handleDayPress(getDateString(day))}
                    disabled={isFutureDate(day)}
                    style={[
                      styles.dayButton,
                      isSelected(day) && styles.dayButtonSelected,
                      isCurrentDate(day) && !isSelected(day) && styles.dayButtonCurrent,
                      isToday(day) && !isSelected(day) && !isCurrentDate(day) && styles.dayButtonToday,
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      index % 7 === 0 && styles.sundayText,
                      index % 7 === 6 && styles.saturdayText,
                      isFutureDate(day) && styles.dayTextDisabled,
                      isSelected(day) && styles.dayTextSelected,
                      isCurrentDate(day) && !isSelected(day) && styles.dayTextCurrent,
                      isToday(day) && !isSelected(day) && !isCurrentDate(day) && styles.dayTextToday,
                    ]}>
                      {day}
                    </Text>
                    {hasAnswer(day) && !isSelected(day) && (
                      <View style={styles.answerDot} />
                    )}
                    {hasQuestion(day) && !hasAnswer(day) && !isSelected(day) && (
                      <View style={styles.questionDot} />
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Legend */}
          <XStack px="$5" pt="$3" gap="$5">
            <XStack ai="center" gap="$2">
              <View style={[styles.legendDot, { backgroundColor: colors.systemBlue }]} />
              <Paragraph fontSize={12} color={colors.textSecondary}>답변 완료</Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendDot, { backgroundColor: colors.systemGray3 }]} />
              <Paragraph fontSize={12} color={colors.textSecondary}>질문만</Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendRing]} />
              <Paragraph fontSize={12} color={colors.textSecondary}>현재 보는 날</Paragraph>
            </XStack>
          </XStack>

          {/* Preview Section */}
          <View style={styles.previewContainer}>
              <YStack gap="$3">
                <XStack ai="center" jc="space-between">
                  <Paragraph fontSize={15} fontWeight="700" color={colors.textPrimary}>
                    {formatPreviewDate(previewDate)}
                  </Paragraph>
                  {previewItem?.answer && (
                    <View style={styles.answeredBadge}>
                      <Text style={styles.answeredBadgeText}>답변 완료</Text>
                    </View>
                  )}
                </XStack>

                <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                  {previewItem ? (
                    <YStack gap="$2">
                      <Paragraph fontSize={14} color={colors.textSecondary}>
                        {previewItem.question}
                      </Paragraph>
                    </YStack>
                  ) : (
                    <Paragraph fontSize={14} color={colors.systemGray3}>
                      이 날의 질문이 없습니다
                    </Paragraph>
                  )}
                </ScrollView>

                <Button
                  label="이 날짜로 이동"
                  onPress={handleNavigateToDate}
                  accessibilityLabel={`${formatPreviewDate(previewDate)}로 이동`}
                />
              </YStack>
          </View>
        </YStack>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.systemBlue,
    paddingHorizontal: 8,
  },
  navArrowDisabled: {
    color: colors.systemGray4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sundayText: {
    color: '#FF6B6B',
  },
  saturdayText: {
    color: colors.systemBlue,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayButtonSelected: {
    backgroundColor: colors.systemBlue,
  },
  dayButtonCurrent: {
    borderWidth: 2,
    borderColor: colors.systemBlue,
  },
  dayButtonToday: {
    backgroundColor: colors.systemGray6,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextDisabled: {
    color: colors.systemGray4,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dayTextCurrent: {
    color: colors.systemBlue,
    fontWeight: '700',
  },
  dayTextToday: {
    color: colors.systemBlue,
    fontWeight: '700',
  },
  answerDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.systemBlue,
  },
  questionDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.systemGray3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.systemBlue,
  },
  previewContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.systemGray6,
    borderRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.25,
  },
  previewScroll: {
    maxHeight: 80,
  },
  answeredBadge: {
    backgroundColor: colors.systemBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  answeredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
});
