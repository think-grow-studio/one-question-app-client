import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { CommonQuestionFeed } from '@/features/feed/components/CommonQuestionFeed';
import { FloatingActionButton } from '@/shared/ui/FloatingActionButton';
import { MOCK_COMMON_QUESTION } from '@/features/feed/api/__mocks__/commonQuestionMock';
import { formatLocalDate } from '@/shared/utils/date';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const router = useRouter();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

  const handleWriteAnswer = () => {
    router.push({
      pathname: '/answer',
      params: {
        source: 'feed',
        date: formatLocalDate(),
        question: MOCK_COMMON_QUESTION.content,
        description: MOCK_COMMON_QUESTION.description ?? '',
      },
    });
  };

  return (
    <Screen edges={['top']} bgColor={theme.backgroundSoft?.val}>
      <YStack flex={1}>
        {/* Header */}
        <YStack style={styles.header}>
          <Text
            variant="caption"
            style={[styles.headerLabel, { color: accent.primary }]}
            {...getFontStyle('700')}
          >
            {t('headerLabel')}
          </Text>
          <Text variant="subheading" {...getFontStyle('700')}>
            {t('title')}
          </Text>
          <Text variant="caption" muted style={styles.headerDesc}>
            {t('headerDesc')}
          </Text>
        </YStack>

        {/* Common Question + Answers */}
        <CommonQuestionFeed />
      </YStack>

      {/* Floating Write Button */}
      <FloatingActionButton onPress={handleWriteAnswer} aboveTabBar label={t('writeButton')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
  },
  headerLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerDesc: {
    marginTop: 6,
    fontSize: 13,
  },
});
