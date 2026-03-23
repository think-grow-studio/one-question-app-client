import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { FeedList } from '@/features/feed/components/FeedList';
import { getFontStyle } from '@/shared/theme/typography';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

  return (
    <Screen edges={['top']}>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.borderColor?.val,
              borderBottomWidth: 1,
            },
          ]}
        >
          <Text variant="subheading" {...getFontStyle('600')}>
            {t('title')}
          </Text>
        </View>

        {/* Feed List */}
        <FeedList />
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
