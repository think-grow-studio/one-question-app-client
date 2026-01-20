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

function getRandomQuestion(questions: QuestionItem[]): QuestionItem {
  return questions[Math.floor(Math.random() * questions.length)];
}

export function DailyQuestionAnswer() {
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'question', 'common']);
  const cardStyles = useQuestionCardStyles();
  const [questionItem, setQuestionItem] = useState<QuestionItem>({ question: '' });
  const [answer, setAnswer] = useState('');
  const [isReloadSheetVisible, setIsReloadSheetVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertDialogButton[];
  }>({ visible: false, title: '' });

  const randomQuestions = t('question:random', { returnObjects: true }) as QuestionItem[];

  useEffect(() => {
    setQuestionItem(getRandomQuestion(randomQuestions));
  }, []);

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

    setAlertConfig({
      visible: true,
      title: t('answer:submit'),
      message: t('answer:submitSuccess'),
      buttons: [{ label: t('common:buttons.confirm'), variant: 'primary', onPress: () => router.back() }],
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const getTodayFormatted = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = t(`question:weekdays.${weekdayKeys[today.getDay()]}`);
    return t('question:dateFormat', { month, day, weekday });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <YStack flex={1} style={{ backgroundColor: accent.background }}>
        {/* Header - Today's Date & Close Button */}
        <ScreenHeader
          title={getTodayFormatted()}
          rightIcon={<CloseIcon size={16} color={theme.color?.val} />}
          onRightPress={() => router.back()}
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
                  <Pressable
                    onPress={handleReloadPress}
                    style={cardStyles.reloadButton}
                    hitSlop={8}
                  >
                    <ReloadIcon size={18} color={theme.color?.val} />
                  </Pressable>
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
                {t('answer:submit')}
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
