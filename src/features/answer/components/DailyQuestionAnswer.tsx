import { useState, useEffect } from 'react';
import {
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { AlertDialog, AlertDialogButton } from '@/shared/ui/AlertDialog';
import { ReloadIcon } from '@/shared/icons/ReloadIcon';
import { CloseIcon } from '@/shared/icons/CloseIcon';
import { useAccentColors } from '@/shared/theme';
import { ReloadOptionSheet } from './ReloadOptionSheet';

type QuestionItem = {
  question: string;
  description?: string;
};

interface EditData {
  date: string;
  question: string;
  description?: string;
  existingAnswer: string;
}

interface DailyQuestionAnswerProps {
  mode?: 'create' | 'edit';
  editData?: EditData;
}

function getRandomQuestion(questions: QuestionItem[]): QuestionItem {
  return questions[Math.floor(Math.random() * questions.length)];
}

export function DailyQuestionAnswer({ mode = 'create', editData }: DailyQuestionAnswerProps) {
  const isEditMode = mode === 'edit';
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'question', 'common']);
  const cardStyles = useQuestionCardStyles();

  // 수정 모드일 때 editData 사용, 아니면 빈 질문으로 시작
  const [questionItem, setQuestionItem] = useState<QuestionItem>(() => {
    if (isEditMode && editData) {
      return {
        question: editData.question,
        description: editData.description,
      };
    }
    return { question: '' };
  });

  // 답변 초기값: 수정 모드면 기존 답변, 아니면 빈 문자열
  const [answer, setAnswer] = useState(() => (isEditMode && editData ? editData.existingAnswer : ''));
  const [originalAnswer] = useState(() => (isEditMode && editData ? editData.existingAnswer : ''));

  // 변경사항 감지 (dirty state)
  const isDirty = answer !== originalAnswer;

  const [isReloadSheetVisible, setIsReloadSheetVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertDialogButton[];
  }>({ visible: false, title: '' });

  const randomQuestions = t('question:random', { returnObjects: true }) as QuestionItem[];

  // 생성 모드일 때만 랜덤 질문 설정
  useEffect(() => {
    if (!isEditMode) {
      setQuestionItem(getRandomQuestion(randomQuestions));
    }
  }, [isEditMode]);

  const isSubmitEnabled = answer.trim().length > 0;

  const handleReloadPress = () => {
    setIsReloadSheetVisible(true);
  };

  const handleRandomQuestion = () => {
    setQuestionItem(getRandomQuestion(randomQuestions));
  };

  const handlePastQuestion = () => {
    setAlertConfig({
      visible: true,
      title: t('common:status.preparing'),
      message: t('common:status.comingSoon'),
      buttons: [{ label: t('common:buttons.confirm'), variant: 'primary' }],
    });
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled) return;

    // 수정 모드와 생성 모드에 따라 다른 메시지 표시
    const title = isEditMode ? t('answer:submitEdit') : t('answer:submit');
    const message = isEditMode ? t('answer:editSuccess') : t('answer:submitSuccess');

    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [{ label: t('common:buttons.confirm'), variant: 'primary', onPress: () => router.back() }],
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // 닫기 버튼 핸들러 - 수정 모드에서 변경사항이 있으면 확인 다이얼로그 표시
  const handleClose = () => {
    if (isEditMode && isDirty) {
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

  // 날짜 포맷팅 함수 - 수정 모드면 editData.date 사용, 아니면 오늘 날짜
  const getFormattedDate = () => {
    const dateToFormat = isEditMode && editData ? new Date(editData.date) : new Date();
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
      <YStack flex={1} style={{ backgroundColor: accent.background }}>
        {/* Header - Date & Close Button */}
        <ScreenHeader
          title={getFormattedDate()}
          rightIcon={<CloseIcon size={16} color={theme.color?.val} />}
          onRightPress={handleClose}
          rightButtonStyle="filled"
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View style={styles.cardContainer}>
            <View style={cardStyles.card}>
              {/* Question Section */}
              <View style={styles.questionSection}>
                <XStack ai="center" jc="space-between" mb="$3">
                  <Text style={cardStyles.labelText}>{t('question:labels.question')}</Text>
                  {/* 수정 모드에서는 reload 아이콘 숨김 */}
                  {!isEditMode && (
                    <Pressable
                      onPress={handleReloadPress}
                      style={cardStyles.reloadButton}
                      hitSlop={8}
                    >
                      <ReloadIcon size={18} color={theme.color?.val} />
                    </Pressable>
                  )}
                </XStack>
                <Text
                  style={cardStyles.questionText}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {questionItem.question}
                </Text>
                {questionItem.description && (
                  <Text
                    style={cardStyles.questionDescription}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {questionItem.description}
                  </Text>
                )}
              </View>

              {/* Divider */}
              <View style={cardStyles.divider} />

              {/* Answer Section */}
              <View style={styles.answerSection}>
                <Text style={[cardStyles.labelText, { marginBottom: 12 }]}>{t('question:labels.answer')}</Text>
                <View style={cardStyles.inputContainer}>
                  <TextInput
                    style={cardStyles.input}
                    multiline
                    value={answer}
                    onChangeText={setAnswer}
                    placeholder={t('answer:placeholder')}
                    placeholderTextColor={theme.colorMuted?.val}
                    textAlignVertical="top"
                  />
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
                isSubmitEnabled ? cardStyles.submitButtonEnabled : cardStyles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isSubmitEnabled}
            >
              <Text
                style={[
                  cardStyles.submitButtonText,
                  isSubmitEnabled ? cardStyles.submitTextEnabled : cardStyles.submitTextDisabled,
                ]}
              >
                {isEditMode ? t('answer:submitEdit') : t('answer:submit')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </YStack>

      <ReloadOptionSheet
        visible={isReloadSheetVisible}
        onClose={() => setIsReloadSheetVisible(false)}
        onRandomQuestion={handleRandomQuestion}
        onPastQuestion={handlePastQuestion}
      />

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
    paddingBottom: 20,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionSection: {
    minHeight: 100,
  },
  answerSection: {
    flex: 1,
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
});
