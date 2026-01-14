import { useState, useEffect } from 'react';
import { Alert, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView, XStack, YStack, useTheme } from 'tamagui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';

function getRandomQuestion(questions: string[]) {
  return questions[Math.floor(Math.random() * questions.length)];
}

export function DailyQuestionAnswer() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(['answer', 'question', 'common']);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} bg="$background">
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Section */}
          <YStack px="$5" pt="$4" gap="$6">
            {/* Question with Reload Button */}
            <YStack gap="$4">
              <XStack ai="flex-start" jc="space-between" gap="$3">
                <Text
                  flex={1}
                  fontSize={24}
                  fontWeight="700"
                  lineHeight={34}
                  letterSpacing={-0.5}
                >
                  {question}
                </Text>
                <Pressable
                  onPress={handleReloadPress}
                  hitSlop={12}
                  style={[
                    styles.reloadButton,
                    { backgroundColor: theme.backgroundSoft?.val },
                  ]}
                >
                  <Text fontSize={20}>↻</Text>
                </Pressable>
              </XStack>
            </YStack>

            {/* Answer Input */}
            <YStack gap="$2">
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.color?.val,
                    backgroundColor: theme.backgroundSoft?.val,
                  },
                ]}
                multiline
                value={answer}
                onChangeText={setAnswer}
                placeholder={t('answer:placeholder')}
                placeholderTextColor={theme.colorMuted?.val}
                textAlignVertical="top"
              />
              <XStack jc="flex-end">
                <Text fontSize={13} color="$colorMuted">
                  {t('answer:charCount', { count: answer.length })}
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Bottom Button */}
        <YStack px="$5" pb="$4" pt="$3">
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitEnabled
                  ? theme.color?.val
                  : theme.backgroundSoft?.val,
              },
            ]}
            onPress={handleSubmit}
            disabled={!isSubmitEnabled}
          >
            <Text
              fontSize={16}
              fontWeight="600"
              color={isSubmitEnabled ? '$background' : '$colorMuted'}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  reloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
