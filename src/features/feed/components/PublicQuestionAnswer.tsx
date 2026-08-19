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
import { useIsAdFreeMember } from '@/features/member/public';
import { useInterstitialAd } from '@/features/admob/public';
import { AdBadge } from '@/shared/ui/ads/AdBadge';
import { BannerAdSlot } from '@/features/admob/public';
import { sp } from '@/shared/utils/responsive';
import {
  useCreatePublicAnswer,
  useUpdatePublicAnswer,
} from '../hooks/mutations/usePublicQuestionMutations';
import { getServiceToday } from '../utils/feedUtils';

interface PublicQuestionAnswerProps {
  mode?: 'create' | 'edit';
  pdqId: number;
  date: string;
  question: string;
  description?: string;
  existingAnswerId?: number;
  existingAnswer?: string;
}

export function PublicQuestionAnswer({
  mode = 'create',
  pdqId,
  date,
  question,
  description,
  existingAnswerId,
  existingAnswer,
}: PublicQuestionAnswerProps) {
  const isEditMode = mode === 'edit';
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const screenBg = useScreenBackground();
  const { t } = useTranslation(['answer', 'question', 'common']);
  const cardStyles = useQuestionCardStyles();
  const isAdFreeMember = useIsAdFreeMember();
  const { showAdAndWait: showPastAnswerAd } = useInterstitialAd('interstitialPublicPastAnswer');
  // 과거 날짜 PDQ 답변 작성/수정 → API 성공 후 광고 → 성공 alert → 사용자 [확인] → modal close.
  // 광고를 alert 전, modal close 전에 호출하여 사용자에게 "광고 → 결과 안내 → 화면 이동" 자연 흐름 제공.
  const isPastDate = date !== getServiceToday();

  const inputMinHeight = (cardStyles.input?.minHeight as number) || 0;
  const resolvedInputHeight = inputMinHeight > 0 ? inputMinHeight : 320;
  const [isAnswerScrollable, setIsAnswerScrollable] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertDialogButton[];
  }>({ visible: false, title: '' });

  const createMutation = useCreatePublicAnswer({
    onAlreadyAnswered: ({ message, syncQueries }) => {
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

  const updateMutation = useUpdatePublicAnswer({
    onAnswerGone: ({ message, syncQueries }) => {
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

  const [answer, setAnswer] = useState(() => (isEditMode && existingAnswer ? existingAnswer : ''));
  const [originalAnswer] = useState(() => (isEditMode && existingAnswer ? existingAnswer : ''));

  const isDirty = answer !== originalAnswer;
  const isSubmitEnabled = answer.trim().length > 0;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleInputContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = event?.nativeEvent?.contentSize?.height;
      if (!contentHeight) return;
      const shouldScroll = contentHeight > resolvedInputHeight;
      setIsAnswerScrollable((prev) => (prev === shouldScroll ? prev : shouldScroll));
    },
    [resolvedInputHeight],
  );

  const showDiscardAlert = useCallback(() => {
    setAlertConfig({
      visible: true,
      title: t('answer:cancelEdit.title'),
      message: t('answer:cancelEdit.message'),
      buttons: [
        { label: t('answer:cancelEdit.continue'), variant: 'default' },
        { label: t('answer:cancelEdit.exit'), variant: 'primary', onPress: () => router.back() },
      ],
    });
  }, [t, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const hasContent = answer.trim().length > 0;
      const shouldShowAlert = isEditMode ? isDirty : hasContent;
      if (shouldShowAlert) {
        showDiscardAlert();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [answer, isEditMode, isDirty, showDiscardAlert]);

  const handleSubmit = useThrottledCallback(async () => {
    if (!isSubmitEnabled || isPending) return;
    try {
      if (isEditMode && existingAnswerId !== undefined) {
        await updateMutation.mutateAsync({
          pdqId,
          answerId: existingAnswerId,
          date,
          content: answer.trim(),
        });
      } else {
        await createMutation.mutateAsync({ pdqId, date, content: answer.trim() });
      }

      // 과거 날짜 신규 작성 + 비 ad-free 회원 → API 성공 후 광고 먼저, alert 은 광고 닫힌 후.
      // 수정(edit) 흐름은 광고 없음 — 이미 본 광고를 또 보이는 건 과한 마찰.
      if (isPastDate && !isAdFreeMember && !isEditMode) {
        await showPastAnswerAd();
      }

      setAlertConfig({
        visible: true,
        title: isEditMode ? t('answer:submitEdit') : t('answer:submit'),
        message: isEditMode ? t('answer:editSuccess') : t('answer:submitSuccess'),
        buttons: [{
          label: t('common:buttons.confirm'),
          variant: 'primary',
          onPress: () => {
            setAlertConfig((p) => ({ ...p, visible: false }));
            router.back();
          },
        }],
      });
    } catch {
      // PUBLIC-QUESTION-004 → onAlreadyAnswered 콜백에서 처리
      // PUBLIC-QUESTION-005 → onAnswerGone 콜백에서 처리
      // 그 외 에러 → cache.onError에서 글로벌 dialog 표시
    }
  }, 500);

  const handleClose = () => {
    const hasContent = answer.trim().length > 0;
    const shouldShowAlert = isEditMode ? isDirty : hasContent;
    if (shouldShowAlert) {
      showDiscardAlert();
    } else {
      router.back();
    }
  };

  const getFormattedDate = () => {
    const dateToFormat = new Date(date);
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
        <ScreenHeader
          title={getFormattedDate()}
          rightIcon={<CloseIcon size={16} color={accent.primary} />}
          onRightPress={handleClose}
          rightButtonStyle="filled"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.cardContainer}>
            <View style={cardStyles.card}>
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
                  {question}
                </Text>
                {description ? (
                  <Text
                    style={cardStyles.questionDescription}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              <View style={[cardStyles.divider, !description && { marginTop: sp(16) }]} />

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

          <View style={styles.submitContainer}>
            <Pressable
              style={[
                cardStyles.submitButton,
                isSubmitEnabled && !isPending
                  ? cardStyles.submitButtonEnabled
                  : cardStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isSubmitEnabled || isPending}
            >
              <View style={styles.submitInner}>
                <Text
                  style={[
                    cardStyles.submitButtonText,
                    isSubmitEnabled && !isPending
                      ? cardStyles.submitTextEnabled
                      : cardStyles.submitTextDisabled,
                  ]}
                >
                  {isPending
                    ? t('common:status.loading')
                    : isEditMode
                      ? t('answer:submitEdit')
                      : t('answer:submit')}
                </Text>
                {/* 과거 날짜 신규 작성 + 광고 회원 → 작성 완료 시 전면 광고 노출 미리 안내. 수정은 광고 없음. */}
                {isPastDate && !isAdFreeMember && !isEditMode ? <AdBadge size="compact" /> : null}
              </View>
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
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: sp(20) },
  cardContainer: { flex: 1, paddingHorizontal: sp(20) },
  questionSection: {},
  answerSection: { flex: 1 },
  answerScroll: { flex: 1 },
  answerScrollContent: { flexGrow: 1 },
  submitContainer: {
    paddingHorizontal: sp(20),
    paddingTop: sp(12),
    paddingBottom: sp(8),
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
  },
});
