import { useState, useEffect } from 'react';
import {
  Alert,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
} from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuestionCardStyles } from '@/shared/ui/QuestionCard';

function getRandomQuestion(questions: string[]) {
  return questions[Math.floor(Math.random() * questions.length)];
}

export function DailyQuestionAnswer() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(['answer', 'question', 'common']);
  const cardStyles = useQuestionCardStyles();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const randomQuestions = t('question:random', { returnObjects: true }) as string[];

  useEffect(() => {
    setQuestion(getRandomQuestion(randomQuestions));
  }, []);

  const isSubmitEnabled = answer.trim().length > 0;

  const handleReloadPress = () => {
    Alert.alert(
      t('answer:reload.title'),
      t('answer:reload.message'),
      [
        {
          text: t('answer:reload.randomQuestion'),
          onPress: () => setQuestion(getRandomQuestion(randomQuestions)),
        },
        {
          text: t('answer:reload.pastQuestion'),
          onPress: () => {
            Alert.alert(t('common:status.preparing'), t('answer:reload.pastQuestionNotReady'));
          },
          style: 'default',
        },
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled) return;

    Alert.alert(t('answer:submit'), t('answer:submitSuccess'), [
      { text: t('common:buttons.confirm'), onPress: () => router.back() },
    ]);
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
      <YStack flex={1} bg="$cardBlue">
        {/* Header - Today's Date & Close Button */}
        <XStack ai="center" jc="space-between" px="$5" pt="$4" mb="$4">
          <Text style={[styles.headerDate, { color: theme.color?.val }]}>
            {getTodayFormatted()}
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: theme.backgroundSoft?.val }]}
          >
            <Text style={[styles.closeIcon, { color: theme.color?.val }]}>✕</Text>
          </Pressable>
        </XStack>

        {/* Question Card */}
        <View style={styles.cardContainer}>
          <View style={[cardStyles.card, cardStyles.cardMinHeight]}>
            {/* Question Section */}
            <View style={styles.questionSection}>
              <XStack ai="center" jc="space-between" mb="$3">
                <Text style={cardStyles.labelText}>{t('question:labels.question')}</Text>
                <Pressable
                  onPress={handleReloadPress}
                  style={cardStyles.reloadButton}
                  hitSlop={8}
                >
                  <Text style={cardStyles.reloadIcon}>↻</Text>
                </Pressable>
              </XStack>
              <Text style={cardStyles.questionText}>{question}</Text>
            </View>

            {/* Divider */}
            <View style={cardStyles.divider} />

            {/* Answer Section */}
            <View style={styles.answerSection}>
              <Text style={[cardStyles.labelText, { marginBottom: 12 }]}>{t('question:labels.answer')}</Text>
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

        {/* Submit Button */}
        <YStack px="$5" pb="$5" pt="$3">
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
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerDate: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionSection: {
    // Question takes minimum space needed
  },
  answerSection: {
    flex: 1,
  },
});
