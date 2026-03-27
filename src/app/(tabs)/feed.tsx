import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { FeedList } from '@/features/feed/components/FeedList';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

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

        {/* Feed List */}
        <FeedList />
      </YStack>
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
