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
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ReloadIcon } from '@/shared/icons/ReloadIcon';
import { CloseIcon } from '@/shared/icons/CloseIcon';
import { useAccentColors } from '@/shared/theme';

function getRandomQuestion(questions: string[]) {
  return questions[Math.floor(Math.random() * questions.length)];
}

export function DailyQuestionAnswer() {
  const router = useRouter();
  const theme = useTheme();
  const accent = useAccentColors();
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
      <YStack flex={1} style={{ backgroundColor: accent.background }}>
        {/* Header - Today's Date & Close Button */}
        <ScreenHeader
          title={getTodayFormatted()}
          rightIcon={<CloseIcon size={16} color={theme.color?.val} />}
          onRightPress={() => router.back()}
          rightButtonStyle="filled"
        />

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
                  <ReloadIcon size={22} color={theme.color?.val} />
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
