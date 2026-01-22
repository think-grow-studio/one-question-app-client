import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, View, Text, PanResponder, BackHandler } from 'react-native';
import { YStack, XStack, Paragraph, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useHistoryStore } from '../stores/useHistoryStore';
import { Button } from '@/shared/ui/Button';
import { useAccentColors } from '@/shared/theme';
import { fs, sp, radius, cs, SCREEN, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/utils/responsive';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_WEEKS = 6;
const DISMISS_THRESHOLD = 100;

export function DatePickerSheet() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { isDatePickerVisible, setIsDatePickerVisible, history, currentDate, setCurrentDate } =
    useHistoryStore();

  // Responsive values (static)
  const DAY_CELL_HEIGHT = cs(52);
  const SHEET_HEIGHT = SHEET_HEIGHTS.full;

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

  // Animation state
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const startY = useRef(0);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setIsDatePickerVisible)(false);
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [setIsDatePickerVisible, translateY, backdropOpacity, SHEET_HEIGHT]);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  useEffect(() => {
    if (isDatePickerVisible) {
      openSheet();
    }
  }, [isDatePickerVisible, openSheet]);

  // Android back button handler
  useEffect(() => {
    if (!isDatePickerVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });

    return () => backHandler.remove();
  }, [isDatePickerVisible, closeSheet]);

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
        const newValue = Math.max(0, startY.current + gestureState.dy);
        translateY.value = newValue;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
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

  // Theme-dependent styles
  const themedStyles = useMemo(
    () => ({
      sheet: {
        backgroundColor: theme.surface?.val,
      },
      handle: {
        backgroundColor: theme.borderColor?.val,
      },
      navArrow: {
        fontSize: fs(24),
        fontWeight: '600' as const,
        color: accent.primary,
        paddingHorizontal: sp(8),
      },
      navArrowDisabled: {
        color: theme.colorSubtle?.val,
      },
      weekdayText: {
        fontSize: fs(14),
        fontWeight: '600' as const,
        color: theme.colorMuted?.val,
      },
      sundayText: {
        color: theme.error?.val,
      },
      saturdayText: {
        color: accent.primary,
      },
      dayText: {
        fontSize: fs(16),
        fontWeight: '500' as const,
        color: theme.color?.val,
      },
      dayTextDisabled: {
        color: theme.colorSubtle?.val,
      },
      dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700' as const,
      },
      dayTextCurrent: {
        color: accent.primary,
        fontWeight: '700' as const,
      },
      dayButtonSelected: {
        backgroundColor: accent.primary,
      },
      dayButtonCurrent: {
        borderWidth: 2,
        borderColor: accent.primary,
      },
      dayButtonToday: {
        backgroundColor: theme.backgroundSoft?.val,
      },
      answerDot: {
        backgroundColor: accent.primary,
      },
      questionDot: {
        backgroundColor: theme.colorSubtle?.val,
      },
      legendRing: {
        borderColor: accent.primary,
      },
      previewContainer: {
        backgroundColor: theme.backgroundSoft?.val,
      },
      previewTitle: {
        color: theme.color?.val,
      },
      previewText: {
        fontSize: fs(14),
        lineHeight: fs(22),
        color: theme.colorMuted?.val,
      },
      previewEmpty: {
        fontSize: fs(14),
        color: theme.colorSubtle?.val,
      },
      answeredBadge: {
        backgroundColor: accent.primary,
      },
    }),
    [theme, accent]
  );

  const responsiveStyles = useMemo(() => ({
    sheetContainer: {
      height: SHEET_HEIGHT,
      maxWidth: SHEET_MAX_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
      borderTopLeftRadius: radius(24),
      borderTopRightRadius: radius(24),
    },
    calendarGrid: {
      paddingHorizontal: sp(16),
      height: DAY_CELL_HEIGHT * MAX_WEEKS,
    },
    dayCell: {
      height: DAY_CELL_HEIGHT,
      padding: sp(2),
    },
    dayButton: {
      borderRadius: radius(12),
    },
    dot: {
      bottom: sp(6),
      width: cs(5),
      height: cs(5),
      borderRadius: cs(2.5),
    },
    legendDot: {
      width: cs(8),
      height: cs(8),
      borderRadius: cs(4),
    },
    legendRing: {
      width: cs(8),
      height: cs(8),
      borderRadius: cs(4),
      borderWidth: 2,
    },
    previewContainer: {
      marginHorizontal: sp(20),
      padding: sp(16),
      borderRadius: radius(16),
      maxHeight: SCREEN.height * 0.25,
    },
    previewContent: {
      height: fs(22) * 2,  // 2줄
    },
    answeredBadge: {
      paddingHorizontal: sp(8),
      paddingVertical: sp(4),
      borderRadius: radius(8),
    },
    answeredBadgeText: {
      fontSize: fs(11),
    },
  }), [SHEET_HEIGHT, DAY_CELL_HEIGHT]);

  const handleClose = () => {
    closeSheet();
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
    <Modal transparent visible={isDatePickerVisible} animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View style={[styles.backdropOverlay, backdropStyle]} />
      </Pressable>

      <Animated.View style={[styles.sheetContainer, responsiveStyles.sheetContainer, sheetStyle, themedStyles.sheet]}>
        {/* Handle - Draggable area */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={[styles.handle, themedStyles.handle]} />
        </View>

        <YStack style={{ paddingBottom: sp(20) }}>
          {/* Content area is not draggable */}

          {/* Month Navigation */}
          <XStack ai="center" jc="space-between" px="$5" pb="$4">
            <Pressable onPress={goToPrevMonth} hitSlop={12}>
              <Text style={themedStyles.navArrow}>{'<'}</Text>
            </Pressable>
            <Paragraph fontSize={fs(20)} fontWeight="700" letterSpacing={-0.3} color="$color">
              {viewYear}년 {viewMonth + 1}월
            </Paragraph>
            <Pressable onPress={goToNextMonth} hitSlop={12} disabled={isNextDisabled}>
              <Text style={[themedStyles.navArrow, isNextDisabled && themedStyles.navArrowDisabled]}>{'>'}</Text>
            </Pressable>
          </XStack>

          {/* Weekday Headers */}
          <XStack px="$4" pb="$2">
            {WEEKDAYS.map((day, index) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[
                  themedStyles.weekdayText,
                  index === 0 && themedStyles.sundayText,
                  index === 6 && themedStyles.saturdayText,
                ]}>
                  {day}
                </Text>
              </View>
            ))}
          </XStack>

          {/* Calendar Grid */}
          <View style={[styles.calendarGrid, responsiveStyles.calendarGrid]}>
            {calendarDays.map((day, index) => (
              <View key={index} style={[styles.dayCell, responsiveStyles.dayCell]}>
                {day !== null && (
                  <Pressable
                    onPress={() => !isFutureDate(day) && handleDayPress(getDateString(day))}
                    disabled={isFutureDate(day)}
                    style={[
                      styles.dayButton,
                      responsiveStyles.dayButton,
                      isSelected(day) && themedStyles.dayButtonSelected,
                      isCurrentDate(day) && !isSelected(day) && themedStyles.dayButtonCurrent,
                      isToday(day) && !isSelected(day) && !isCurrentDate(day) && themedStyles.dayButtonToday,
                    ]}
                  >
                    <Text style={[
                      themedStyles.dayText,
                      index % 7 === 0 && themedStyles.sundayText,
                      index % 7 === 6 && themedStyles.saturdayText,
                      isFutureDate(day) && themedStyles.dayTextDisabled,
                      isSelected(day) && themedStyles.dayTextSelected,
                      isCurrentDate(day) && !isSelected(day) && themedStyles.dayTextCurrent,
                      isToday(day) && !isSelected(day) && !isCurrentDate(day) && themedStyles.dayTextCurrent,
                    ]}>
                      {day}
                    </Text>
                    {hasAnswer(day) && !isSelected(day) && (
                      <View style={[styles.dot, responsiveStyles.dot, themedStyles.answerDot]} />
                    )}
                    {hasQuestion(day) && !hasAnswer(day) && !isSelected(day) && (
                      <View style={[styles.dot, responsiveStyles.dot, themedStyles.questionDot]} />
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Legend */}
          <XStack px="$5" pt="$1" gap="$5">
            <XStack ai="center" gap="$2">
              <View style={[styles.legendDot, responsiveStyles.legendDot, themedStyles.answerDot]} />
              <Paragraph fontSize={fs(12)} color="$colorMuted">답변 완료</Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendDot, responsiveStyles.legendDot, themedStyles.questionDot]} />
              <Paragraph fontSize={fs(12)} color="$colorMuted">질문만</Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendRing, responsiveStyles.legendRing, themedStyles.legendRing]} />
              <Paragraph fontSize={fs(12)} color="$colorMuted">현재 보는 날</Paragraph>
            </XStack>
          </XStack>

          {/* Preview Section */}
          <View style={[styles.previewContainer, responsiveStyles.previewContainer, themedStyles.previewContainer]}>
              <YStack gap="$1">
                <XStack ai="center" jc="space-between" height={24}>
                  <Paragraph fontSize={fs(15)} fontWeight="700" style={themedStyles.previewTitle}>
                    {formatPreviewDate(previewDate)}
                  </Paragraph>
                  <View style={[
                    styles.answeredBadge,
                    responsiveStyles.answeredBadge,
                    themedStyles.answeredBadge,
                    !previewItem?.answer && styles.badgeHidden,
                  ]}>
                    <Text style={[styles.answeredBadgeText, responsiveStyles.answeredBadgeText]}>답변 완료</Text>
                  </View>
                </XStack>

                <View style={[styles.previewContent, responsiveStyles.previewContent]}>
                  {previewItem ? (
                    <Text
                      style={themedStyles.previewText}
                      numberOfLines={2}
                    >
                      {previewItem.question}
                    </Text>
                  ) : (
                    <Text style={themedStyles.previewEmpty}>
                      이 날의 질문이 없습니다
                    </Text>
                  )}
                </View>

                <View style={{ marginTop: sp(12) }}>
                  <Button
                    label="이 날짜로 이동"
                    onPress={handleNavigateToDate}
                    accessibilityLabel={`${formatPreviewDate(previewDate)}로 이동`}
                  />
                </View>
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
    paddingVertical: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
  legendDot: {},
  legendRing: {},
  previewContainer: {
    marginTop: 0,
  },
  previewContent: {},
  answeredBadge: {},
  answeredBadgeText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeHidden: {
    opacity: 0,
  },
});
