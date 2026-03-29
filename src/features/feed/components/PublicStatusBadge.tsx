import { StyleSheet, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { GlobeIcon } from '@/shared/icons/GlobeIcon';
import { LockIcon } from '@/shared/icons/LockIcon';
import { useAccentColors } from '@/shared/theme';

interface PublicStatusBadgeProps {
  published: boolean;
}

export function PublicStatusBadge({ published }: PublicStatusBadgeProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: published
            ? 'rgba(255, 107, 107, 0.1)'
            : (theme.backgroundSoft?.val ?? '#f5f5f5'),
        },
      ]}
    >
      <XStack alignItems="center" gap="$1.5">
        {published ? (
          <GlobeIcon size={14} color={accent.primary} />
        ) : (
          <LockIcon size={14} color={theme.colorMuted?.val ?? '#999'} />
        )}
        <Text
          variant="caption"
          color={published ? (accent.primary as any) : '$colorMuted'}
          style={{ fontSize: 12 }}
        >
          {published ? t('publicToggle.publicStatus') : t('publicToggle.privateStatus')}
        </Text>
      </XStack>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
});
