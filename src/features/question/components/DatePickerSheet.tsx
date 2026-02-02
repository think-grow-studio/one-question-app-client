import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Modal, Pressable, StyleSheet, View, Text, PanResponder, BackHandler, ActivityIndicator } from 'react-native';
import { YStack, XStack, Paragraph, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useDatePickerStore } from '../stores/useDatePickerStore';
import { useSlideDirectionStore } from '../stores/useSlideDirectionStore';
import { useCalendarHistory } from '../hooks/queries/useQuestionQueries';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { Button } from '@/shared/ui/Button';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useAccentColors } from '@/shared/theme';
import { fs, sp, radius, cs, SCREEN, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/utils/responsive';
import type { DailyQuestionDomain } from '../domain/questionDomain';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MAX_WEEKS = 6;
const DISMISS_THRESHOLD = 100;

export const DatePickerSheet = memo(function DatePickerSheet() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['question', 'common']);
  const { isDatePickerVisible, setIsDatePickerVisible, currentDate, setCurrentDate } =
    useDatePickerStore();
  const { setDirectionForCalendar } = useSlideDirectionStore();

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

  // 가입일 이전 날짜 클릭 시 오류 메시지 상태
  const [joinDateError, setJoinDateError] = useState(false);

  // 오늘 정보 (다른 계산에서도 재사용)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

  // 회원 정보 조회 (cycleStartDate 제한용)
  const { data: member } = useMemberMe();

  const calendarFetchBaseDate = useMemo(() => {
    if (!member?.cycleStartDate) {
      return null;
    }

    const [cycleYear, cycleMonth, cycleDay] = member.cycleStartDate
      .split('-')
      .map(Number);

    const monthLastDay = new Date(viewYear, viewMonth + 1, 0).getDate();

    let minDay = 1;
    if (cycleYear === viewYear && cycleMonth === viewMonth + 1) {
      minDay = cycleDay;
    }

    let maxDay = monthLastDay;
    if (todayYear === viewYear && todayMonth === viewMonth) {
      maxDay = todayDay;
    }

    if (minDay > maxDay) {
      minDay = maxDay;
    }

    const clampedDay = Math.min(Math.max(15, minDay), maxDay);
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }, [member?.cycleStartDate, viewYear, viewMonth, todayYear, todayMonth, todayDay]);

  const shouldLoadCalendar = isDatePickerVisible && Boolean(calendarFetchBaseDate);

  // API: 달력 전용 히스토리 조회 (35일치 도메인 객체 배열)
  const { data: historyList, isLoading: isHistoryLoading } = useCalendarHistory(
    viewYear,
    viewMonth,
    {
      enabled: shouldLoadCalendar,
      baseDateOverride: calendarFetchBaseDate ?? undefined,
    }
  );

  const showCalendarLoading = shouldLoadCalendar
    ? isHistoryLoading
    : Boolean(isDatePickerVisible && !calendarFetchBaseDate);

  // 히스토리 데이터를 날짜별 맵으로 변환
  // historyList에서 도메인 객체 배열을 받아서 바로 Map으로 변환
  const historyMap = useMemo(() => {
    const map = new Map<string, DailyQuestionDomain>();
    historyList?.forEach(item => map.set(item.date, item));
    return map;
  }, [historyList]);

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
    setJoinDateError(false); // 시트 열 때 오류 상태 초기화
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  // 시트가 "처음 열릴 때만" openSheet 호출하도록 중복 호출 방지
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isDatePickerVisible && !wasVisibleRef.current) {
      wasVisibleRef.current = true;

      // 달력이 열릴 때마다 현재 슬라이드에서 보고 있는 날짜의 달로 리셋
      const [year, month] = currentDate.split('-').map(Number);
      setViewYear(year);
      setViewMonth(month - 1); // 0-indexed
      setPreviewDate(currentDate);

      openSheet();
    } else if (!isDatePickerVisible) {
      wasVisibleRef.current = false;
    }
  }, [isDatePickerVisible, currentDate, openSheet]);

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
      width: cs(10),
      height: cs(10),
      borderRadius: radius(3),
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

  const handleClose = useCallback(() => {
    closeSheet();
  }, [closeSheet]);

  const handleNavigateToDate = useCallback(() => {
    setDirectionForCalendar();
    setCurrentDate(previewDate);
    closeSheet();
  }, [setDirectionForCalendar, setCurrentDate, previewDate, closeSheet]);

  const goToPrevMonth = useCallback(() => {
    // cycleStartDate가 없으면 (로딩 중이거나 오류) 이동 불가
    if (!member?.cycleStartDate) {
      return;
    }

    // cycleStartDate 이전 월로 이동 불가
    const [cycleStartYear, cycleStartMonth] = member.cycleStartDate.split('-').map(Number);
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;

    if (prevYear < cycleStartYear || (prevYear === cycleStartYear && prevMonth < cycleStartMonth - 1)) {
      return;
    }

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [member?.cycleStartDate, viewMonth, viewYear]);

  const goToNextMonth = useCallback(() => {
    const today = new Date();
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

    if (nextYear > today.getFullYear() ||
        (nextYear === today.getFullYear() && nextMonth > today.getMonth())) {
      return;
    }

    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }, [viewMonth, viewYear]);

  // getDateString 함수
  const getDateString = useCallback((day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [viewYear, viewMonth]);

  // isFutureDate 함수
  const isFutureDate = useCallback((day: number) => {
    return getDateString(day) > todayStr;
  }, [getDateString, todayStr]);

  // isBeforeCycleStartDate 함수
  const isBeforeCycleStartDate = useCallback((day: number) => {
    if (!member?.cycleStartDate) return true;
    return getDateString(day) < member.cycleStartDate;
  }, [getDateString, member?.cycleStartDate]);

  const handleDayPress = useCallback((dateStr: string) => {
    setPreviewDate(dateStr);
  }, []);

  // 가입일 이전 날짜 클릭 시 오류 메시지 표시 (1번만)
  const handleDayPressWithValidation = useCallback((day: number) => {
    const dateStr = getDateString(day);

    // 미래 날짜는 disabled로 처리되므로 무시
    if (isFutureDate(day)) {
      return;
    }

    // cycleStartDate 이전이면 오류 메시지 표시 (이동 안함)
    if (isBeforeCycleStartDate(day)) {
      if (!joinDateError) {
        setJoinDateError(true);
      }
      return;
    }

    handleDayPress(dateStr);
  }, [getDateString, isFutureDate, isBeforeCycleStartDate, joinDateError, handleDayPress]);

  // 다음 달 버튼 비활성화 여부
  const isNextDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  // 이전 달 버튼 비활성화 여부 (cycleStartDate 기준)
  const isPrevDisabled = useMemo(() => {
    // cycleStartDate가 없으면 (로딩 중이거나 오류) 안전하게 비활성화
    if (!member?.cycleStartDate) return true;
    const [cycleStartYear, cycleStartMonth] = member.cycleStartDate.split('-').map(Number);
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    return prevYear < cycleStartYear || (prevYear === cycleStartYear && prevMonth < cycleStartMonth - 1);
  }, [member?.cycleStartDate, viewYear, viewMonth]);

  // 달력 데이터 생성 (memoized)
  const calendarDays = useMemo(() => {
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
  }, [viewYear, viewMonth]);

  const getHistoryItem = useCallback((dateStr: string) => {
    return historyMap.get(dateStr) || null;
  }, [historyMap]);

  const hasAnswer = useCallback((day: number) => {
    const item = getHistoryItem(getDateString(day));
    return item?.status === 'ANSWERED';
  }, [getHistoryItem, getDateString]);

  const hasQuestion = useCallback((day: number) => {
    const item = getHistoryItem(getDateString(day));
    return item?.status === 'ANSWERED' || item?.status === 'UNANSWERED';
  }, [getHistoryItem, getDateString]);

  const isDateDisabled = useCallback((day: number) => {
    return isFutureDate(day) || isBeforeCycleStartDate(day);
  }, [isFutureDate, isBeforeCycleStartDate]);

  const isSelected = useCallback((day: number) => {
    return getDateString(day) === previewDate;
  }, [getDateString, previewDate]);

  const isCurrentDate = useCallback((day: number) => {
    return getDateString(day) === currentDate;
  }, [getDateString, currentDate]);

  const isToday = useCallback((day: number) => {
    return getDateString(day) === todayStr;
  }, [getDateString, todayStr]);

  // 미리보기 데이터
  const previewItem = useMemo(() => getHistoryItem(previewDate), [getHistoryItem, previewDate]);

  // previewDate가 cycleStartDate 이전인지 확인 (이동 버튼 비활성화용)
  const isPreviewBeforeCycleStartDate = useMemo(
    () => !member?.cycleStartDate || previewDate < member.cycleStartDate,
    [member?.cycleStartDate, previewDate]
  );

  const formatPreviewDate = useCallback((dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekdayKey = WEEKDAY_KEYS[date.getDay()] ?? 'sun';
    return t('question:dateFormat', {
      month,
      day,
      weekday: t(`question:weekdays.${weekdayKey}`),
    });
  }, [t]);

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
            <Pressable onPress={goToPrevMonth} hitSlop={12} disabled={isPrevDisabled}>
              <Text style={[themedStyles.navArrow, isPrevDisabled && themedStyles.navArrowDisabled]}>{'<'}</Text>
            </Pressable>
            <XStack ai="center" gap="$2">
              <Paragraph fontSize={fs(20)} fontWeight="700" letterSpacing={-0.3} color="$color">
                {t('question:calendar.monthTitle', { year: viewYear, month: viewMonth + 1 })}
              </Paragraph>
              {showCalendarLoading && (
                <ActivityIndicator size="small" color={theme.colorMuted?.val} />
              )}
            </XStack>
            <Pressable onPress={goToNextMonth} hitSlop={12} disabled={isNextDisabled}>
              <Text style={[themedStyles.navArrow, isNextDisabled && themedStyles.navArrowDisabled]}>{'>'}</Text>
            </Pressable>
          </XStack>

          {/* Weekday Headers */}
          <XStack px="$4" pb="$2">
            {WEEKDAY_KEYS.map((weekdayKey, index) => (
              <View key={weekdayKey} style={styles.weekdayCell}>
                <Text style={[
                  themedStyles.weekdayText,
                  index === 0 && themedStyles.sundayText,
                  index === 6 && themedStyles.saturdayText,
                ]}>
                  {t(`question:weekdays.${weekdayKey}`)}
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
                    onPress={() => handleDayPressWithValidation(day)}
                    disabled={isFutureDate(day)}
                    style={[
                      styles.dayButton,
                      responsiveStyles.dayButton,
                      isSelected(day) && themedStyles.dayButtonSelected,
                      isCurrentDate(day) && themedStyles.dayButtonCurrent,
                      isToday(day) && !isSelected(day) && !isCurrentDate(day) && themedStyles.dayButtonToday,
                    ]}
                  >
                    <Text style={[
                      themedStyles.dayText,
                      index % 7 === 0 && themedStyles.sundayText,
                      index % 7 === 6 && themedStyles.saturdayText,
                      isDateDisabled(day) && themedStyles.dayTextDisabled,
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
              <Paragraph fontSize={fs(12)} color="$colorMuted">
                {t('question:calendar.legend.answered')}
              </Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendDot, responsiveStyles.legendDot, themedStyles.questionDot]} />
              <Paragraph fontSize={fs(12)} color="$colorMuted">
                {t('question:calendar.legend.questionOnly')}
              </Paragraph>
            </XStack>
            <XStack ai="center" gap="$2">
              <View style={[styles.legendRing, responsiveStyles.legendRing, themedStyles.legendRing]} />
              <Paragraph fontSize={fs(12)} color="$colorMuted">
                {t('question:calendar.legend.current')}
              </Paragraph>
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
                    previewItem?.status !== 'ANSWERED' && styles.badgeHidden,
                  ]}>
                    <Text style={[styles.answeredBadgeText, responsiveStyles.answeredBadgeText]}>
                      {t('question:status.answered')}
                    </Text>
                  </View>
                </XStack>

                <View style={[styles.previewContent, responsiveStyles.previewContent]}>
                  {previewItem?.question ? (
                    <Text
                      style={themedStyles.previewText}
                      numberOfLines={2}
                    >
                      {previewItem.question.content}
                    </Text>
                  ) : (
                    <Text style={themedStyles.previewEmpty}>
                      {t('question:empty.noQuestion')}
                    </Text>
                  )}
                </View>

                <View style={{ marginTop: sp(12) }}>
                  <Button
                    label={t('question:calendar.goToDate')}
                    onPress={handleNavigateToDate}
                    disabled={isPreviewBeforeCycleStartDate}
                    accessibilityLabel={t('question:calendar.accessibility.goToDate', {
                      date: formatPreviewDate(previewDate),
                    })}
                  />
                </View>
              </YStack>
          </View>
        </YStack>
      </Animated.View>

      <AlertDialog
        visible={joinDateError}
        title={t('question:calendar.errors.beforeCycleTitle')}
        message={t('question:calendar.errors.beforeCycleMessage')}
        buttons={[{ label: t('common:buttons.confirm'), variant: 'primary' }]}
        onClose={() => setJoinDateError(false)}
      />
    </Modal>
  );
});

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
