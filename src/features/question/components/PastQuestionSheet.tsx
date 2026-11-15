import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { fs, sp, radius, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/shared/utils/responsive';
import { usePastQuestions } from '../hooks/queries/useQuestionQueries';
import type { PastQuestionDto } from '../types/api';

/**
 * - serve: 그날 질문이 아직 없음 → 고른 질문을 첫 질문으로 받음 (POST /past)
 * - reload: 이미 질문이 있음 → 고른 질문으로 재할당 (POST /past/reload)
 */
export type PastQuestionMode = 'serve' | 'reload';

type PastQuestionSheetProps = {
  /** null 이면 닫힘 */
  mode: PastQuestionMode | null;
  date: string;
  /** reload 모드에서 현재 선택된 질문 — 탭하면 아무 요청 없이 닫힘 */
  currentQuestionId?: number;
  /** reload 모드에서 변경 횟수가 남았는지 — false 면 오늘 후보에 없던 질문(차감 필요)은 비활성 */
  canSpendChange: boolean;
  onClose: () => void;
  /** 시트의 native dismiss 완료 후 호출 (광고 present 와 transition 충돌 방지) */
  onSelect: (question: PastQuestionDto, mode: PastQuestionMode) => void;
};

export function PastQuestionSheet({
  mode,
  date,
  currentQuestionId,
  canSpendChange,
  onClose,
  onSelect,
}: PastQuestionSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'common']);
  const { data } = usePastQuestions(date);
  const questions = data?.questions ?? [];

  const visible = mode != null;
  const SHEET_HEIGHT = SHEET_HEIGHTS.large;
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // afterClose 콜백은 네이티브 Modal dismiss 완료 후 실행 (ReloadOptionSheet 와 동일한 이유:
  // dismiss 전에 광고 ViewController 를 present 하면 iOS 에서 광고가 즉시 닫히고 터치가 먹통).
  // - iOS: <Modal onDismiss>
  // - Android: onDismiss 없음 → visible true→false 변화 후 다음 frame
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
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity, SHEET_HEIGHT]);

  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      prevVisibleRef.current = visible;
      return;
    }
    if (prevVisibleRef.current && !visible) {
      requestAnimationFrame(runAfterClose);
    }
    prevVisibleRef.current = visible;
  }, [visible, runAfterClose]);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdropOpacity.value = withTiming(0.5, { duration: 250 });
    }
  }, [visible, translateY, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [visible, closeSheet]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const isReload = mode === 'reload';

  const handleSelect = (question: PastQuestionDto) => {
    if (!mode) return;
    if (isReload && question.questionId === currentQuestionId) {
      closeSheet();
      return;
    }
    closeSheet(() => onSelect(question, mode));
  };

  // 같은 날(MM-DD)의 이전 해들이므로 연도만 표시: "2025, 2023"
  const formatYears = (dates: string[]) => dates.map((d) => d.slice(0, 4)).join(', ');

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onDismiss={runAfterClose}
      onRequestClose={() => closeSheet()}
    >
      {visible && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />
          </Pressable>

          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_HEIGHT, paddingBottom: insets.bottom + sp(16) },
              sheetStyle,
              { backgroundColor: theme.surface?.val },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />

            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.color?.val }]}>
                {t('answer:past.title')}
              </Text>
              <Text style={[styles.message, { color: theme.colorMuted?.val }]}>
                {t('answer:past.message')}
              </Text>
              {isReload && !canSpendChange && (
                <Text style={[styles.notice, { color: theme.colorMuted?.val }]}>
                  {t('answer:past.noChangesLeft')}
                </Text>
              )}

              <ScrollView style={styles.list} showsVerticalScrollIndicator nestedScrollEnabled>
                {questions.map((question) => {
                  const isCurrent = isReload && question.questionId === currentQuestionId;
                  const disabled = isReload && !question.inCandidates && !canSpendChange;
                  return (
                    <Pressable
                      key={question.questionId}
                      onPress={() => handleSelect(question)}
                      disabled={disabled}
                      accessibilityState={{ disabled, selected: isCurrent }}
                      style={({ pressed }) => [
                        styles.item,
                        {
                          backgroundColor: isCurrent
                            ? `${accent.primary}18`
                            : theme.backgroundSoft?.val ?? '#262627',
                        },
                        pressed && !isCurrent && { opacity: 0.7 },
                        disabled && { opacity: 0.45 },
                      ]}
                    >
                      {isCurrent && (
                        <View style={[styles.accentBar, { backgroundColor: accent.primary }]} />
                      )}
                      <Text
                        style={[styles.itemText, { color: theme.color?.val }]}
                        numberOfLines={2}
                      >
                        {question.content}
                      </Text>
                      <View style={styles.itemMeta}>
                        <Text style={[styles.itemMetaText, { color: theme.colorMuted?.val }]}>
                          {t('answer:past.metIn', { years: formatYears(question.assignedDates) })}
                        </Text>
                        {isReload && question.inCandidates && (
                          <Text style={[styles.itemMetaText, { color: accent.primary }]}>
                            {t('answer:past.metToday')}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    backgroundColor: pressed ? theme.backgroundSoft?.val : theme.background?.val,
                    borderColor: theme.borderColor?.val,
                  },
                ]}
                onPress={() => closeSheet()}
              >
                <Text style={[styles.cancelText, { color: theme.color?.val }]}>
                  {t('common:buttons.cancel')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: radius(24),
    borderTopRightRadius: radius(24),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: sp(16),
  },
  content: {
    flex: 1,
    paddingHorizontal: sp(16),
  },
  title: {
    ...getFontStyle('700'),
    fontSize: fs(18),
    textAlign: 'center',
    marginBottom: sp(4),
  },
  message: {
    fontSize: fs(14),
    textAlign: 'center',
    marginBottom: sp(16),
  },
  notice: {
    fontSize: fs(13),
    textAlign: 'center',
    marginTop: -sp(8),
    marginBottom: sp(16),
  },
  list: {
    flex: 1,
  },
  item: {
    paddingVertical: sp(14),
    paddingHorizontal: sp(16),
    borderRadius: radius(16),
    marginBottom: sp(8),
    overflow: 'hidden',
    gap: sp(6),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  itemText: {
    ...getFontStyle('500'),
    fontSize: fs(15),
    lineHeight: fs(15) * 1.5,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  itemMetaText: {
    ...getFontStyle('500'),
    fontSize: fs(12),
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: 'center',
    marginTop: sp(12),
    paddingVertical: sp(16),
    borderRadius: radius(16),
  },
  cancelText: {
    ...getFontStyle('600'),
    fontSize: fs(16),
  },
});
