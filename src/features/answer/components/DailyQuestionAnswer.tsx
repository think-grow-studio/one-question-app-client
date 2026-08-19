import { useState, useEffect, useCallback } from 'react';
import {
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  BackHandler,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { AlertDialog, AlertDialogButton } from '@/shared/ui/AlertDialog';
import { CloseIcon } from '@/shared/icons/CloseIcon';
import { useAccentColors, useScreenBackground } from '@/shared/theme';
import { useThrottledCallback } from '@/shared/hooks/useThrottledCallback';
import { useAppReviewPrompt } from '../hooks/useAppReviewPrompt';
import { useCreateAnswer, useUpdateAnswer } from '@/features/question/public';
import { BannerAdSlot } from '@/features/admob/public';
import { sp } from '@/shared/utils/responsive';
import { logScreenView, logEvent, AnalyticsEvents } from '@/platform/firebase';

interface QuestionData {
  date: string;
  question: string;
  description?: string;
  existingAnswer?: string;
}

interface DailyQuestionAnswerProps {
  mode?: 'create' | 'edit';
  data: QuestionData;
}

export function DailyQuestionAnswer({ mode = 'create', data }: DailyQuestionAnswerProps) {
  const isEditMode = mode === 'edit';
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const screenBg = useScreenBackground();
  const { t } = useTranslation(['answer', 'question', 'common']);
  const cardStyles = useQuestionCardStyles();
  const { maybeRequestReview } = useAppReviewPrompt();

  const inputMinHeight = (cardStyles.input?.minHeight as number) || 0;
  const resolvedInputHeight = inputMinHeight > 0 ? inputMinHeight : 320;
  const [isAnswerScrollable, setIsAnswerScrollable] = useState(false);

  // API Mutations
  const createAnswerMutation = useCreateAnswer({
    onDuplicateAnswer: ({ message, syncQueries }) => {
      // 사용자가 dialog 확인 시점에 캐시 동기화 + 시트 닫기
      setAlertConfig({
        visible: true,
        title: t('common:error.title'),
        message,
        buttons: [{
          label: t('common:buttons.confirm'),
          variant: 'primary',
          onPress: () => {
            syncQueries();
            router.back();
          },
        }],
      });
    },
  });
  const updateAnswerMutation = useUpdateAnswer();

  // 답변 초기값: 수정 모드면 기존 답변, 아니면 빈 문자열
  const [answer, setAnswer] = useState(() => (isEditMode && data.existingAnswer ? data.existingAnswer : ''));
  const [originalAnswer] = useState(() => (isEditMode && data.existingAnswer ? data.existingAnswer : ''));

  // 변경사항 감지 (dirty state)
  const isDirty = answer !== originalAnswer;

  // Analytics: 화면 진입
  useEffect(() => {
    if (isEditMode) {
      logScreenView('Answer_Edit');
    } else {
      logScreenView('Answer_Create');
      logEvent(AnalyticsEvents.ANSWER_START, {
        date: data.date,
      });
    }
  }, [isEditMode, data.date]);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertDialogButton[];
  }>({ visible: false, title: '' });

  const handleInputContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = event?.nativeEvent?.contentSize?.height;
      if (!contentHeight) return;

      const shouldScroll = contentHeight > resolvedInputHeight;
      setIsAnswerScrollable((prev) => (prev === shouldScroll ? prev : shouldScroll));
    },
    [resolvedInputHeight]
  );

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const hasContent = answer.trim().length > 0;
      const shouldShowAlert = isEditMode ? isDirty : hasContent;

      if (shouldShowAlert) {
        setAlertConfig({
          visible: true,
          title: t('answer:cancelEdit.title'),
          message: t('answer:cancelEdit.message'),
          buttons: [
            { label: t('answer:cancelEdit.continue'), variant: 'default' },
            { label: t('answer:cancelEdit.exit'), variant: 'primary', onPress: () => router.back() },
          ],
        });
        return true; // 기본 뒤로가기 동작 방지
      }
      return false; // 기본 뒤로가기 동작 허용
    });

    return () => backHandler.remove();
  }, [answer, isEditMode, isDirty]);

  const isSubmitEnabled = answer.trim().length > 0;
  const isPending = createAnswerMutation.isPending || updateAnswerMutation.isPending;

  const handleSubmit = useThrottledCallback(async () => {
    if (!isSubmitEnabled || isPending) return;

    try {
      if (isEditMode) {
        await updateAnswerMutation.mutateAsync({ date: data.date, answer: answer.trim() });
        // Analytics: 답변 수정 성공 시에만 기록
        logEvent(AnalyticsEvents.ANSWER_EDIT, {
          date: data.date,
          answer_length: answer.trim().length,
        });
      } else {
        await createAnswerMutation.mutateAsync({ date: data.date, answer: answer.trim() });
        // Analytics: 답변 제출 성공 시에만 기록
        logEvent(AnalyticsEvents.ANSWER_SUBMIT, {
          date: data.date,
          answer_length: answer.trim().length,
        });
      }

      // 성공 메시지 표시
      const title = isEditMode ? t('answer:submitEdit') : t('answer:submit');
      const message = isEditMode ? t('answer:editSuccess') : t('answer:submitSuccess');

      setAlertConfig({
        visible: true,
        title,
        message,
        buttons: [{
          label: t('common:buttons.confirm'),
          variant: 'primary',
          onPress: () => {
            // 새 답변(create) 경로일 때만 review 트리거. system 빈도 제한이 dialog 표시 여부를 결정.
            // fire-and-forget — router.back()을 막지 않음. native dialog는 system-level이라
            // 다음 화면 위로 자연스럽게 표시됨.
            if (!isEditMode) {
              void maybeRequestReview();
            }
            router.back();
          },
        }],
      });
    } catch {
      // QUESTION-004 → useCreateAnswer의 onDuplicateAnswer 콜백에서 처리
      // 그 외 에러 → cache.onError에서 dialog 표시 완료
    }
  }, 500);

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // 닫기 버튼 핸들러 - 수정 모드에서 변경사항이 있으면 확인 다이얼로그 표시
  const handleClose = () => {
    // 생성 모드: 내용이 있으면 팝업
    // 수정 모드: 변경사항이 있으면 팝업
    const hasContent = answer.trim().length > 0;
    const shouldShowAlert = isEditMode ? isDirty : hasContent;

    if (shouldShowAlert) {
      setAlertConfig({
        visible: true,
        title: t('answer:cancelEdit.title'),
        message: t('answer:cancelEdit.message'),
        buttons: [
          { label: t('answer:cancelEdit.continue'), variant: 'default' },
          { label: t('answer:cancelEdit.exit'), variant: 'primary', onPress: () => router.back() },
        ],
      });
    } else {
      router.back();
    }
  };

  // 날짜 포맷팅 함수
  const getFormattedDate = () => {
    const dateToFormat = new Date(data.date);
    const month = dateToFormat.getMonth() + 1;
    const day = dateToFormat.getDate();
    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = t(`question:weekdays.${weekdayKeys[dateToFormat.getDay()]}`);
    return t('question:dateFormat', { month, day, weekday });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <YStack flex={1} style={{ backgroundColor: screenBg }}>
        {/* Header - Date & Close Button */}
        <ScreenHeader
          title={getFormattedDate()}
          rightIcon={<CloseIcon size={16} color={accent.primary} />}
          onRightPress={handleClose}
          rightButtonStyle="filled"
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Question Card */}
          <View style={styles.cardContainer}>
            <View style={cardStyles.card}>
              {/* Question Section */}
              <View style={styles.questionSection}>
                <Text
                  style={cardStyles.questionText}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  {...(Platform.OS === 'android' && { android_hyphenationFrequency: 'none' })}
                  {...(Platform.OS === 'ios' && { lineBreakMode: 'tail' })}
                >
                  <Text style={[cardStyles.questionText, { color: accent.primary }]}>Q. </Text>
                  {data.question}
                </Text>
                {data.description && (
                  <Text
                    style={cardStyles.questionDescription}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {data.description}
                  </Text>
                )}
              </View>

              {/* Divider */}
              <View style={[cardStyles.divider, !data.description && { marginTop: sp(16) }]} />

              {/* Answer Section */}
              <View style={styles.answerSection}>
                <View style={cardStyles.inputContainer}>
                  <ScrollView
                    style={[styles.answerScroll, { height: resolvedInputHeight }]}
                    contentContainerStyle={styles.answerScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                    scrollEnabled={isAnswerScrollable}
                  >
                    <TextInput
                      style={[cardStyles.input, { minHeight: resolvedInputHeight }]}
                      multiline
                      value={answer}
                      onChangeText={setAnswer}
                      placeholder={t('answer:placeholder')}
                      placeholderTextColor={theme.colorMuted?.val}
                      textAlignVertical="top"
                      editable={!isPending}
                      onContentSizeChange={handleInputContentSizeChange}
                      {...(Platform.OS === 'android' && {
                        android_hyphenationFrequency: 'none',
                        textBreakStrategy: 'simple',
                      })}
                    />
                  </ScrollView>
                  <Text style={cardStyles.charCount}>
                    {t('answer:charCount', { count: answer.length })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Pressable
              style={[
                cardStyles.submitButton,
                isSubmitEnabled && !isPending ? cardStyles.submitButtonEnabled : cardStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isSubmitEnabled || isPending}
            >
              <Text
                style={[
                  cardStyles.submitButtonText,
                  isSubmitEnabled && !isPending ? cardStyles.submitTextEnabled : cardStyles.submitTextDisabled,
                ]}
              >
                {isPending
                  ? t('common:status.loading')
                  : isEditMode
                    ? t('answer:submitEdit')
                    : t('answer:submit')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
        <View style={{ width: '100%', paddingHorizontal: sp(20) }}>
          <BannerAdSlot disableSafeAreaPadding />
        </View>
      </YStack>

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: sp(20),
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: sp(20),
  },
  questionSection: {},
  answerSection: {
    flex: 1,
  },
  answerScroll: {
    flex: 1,
  },
  answerScrollContent: {
    flexGrow: 1,
  },
  submitContainer: {
    paddingHorizontal: sp(20),
    paddingTop: sp(12),
    paddingBottom: sp(8),
  },
});
