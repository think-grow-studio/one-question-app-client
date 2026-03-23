import { Pressable, StyleSheet } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { GlobeIcon } from '@/shared/icons/GlobeIcon';
import { LockIcon } from '@/shared/icons/LockIcon';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';

interface PublicStatusBadgeProps {
  isPublic: boolean;
  likeCount?: number;
  onToggle?: () => void;
}

export function PublicStatusBadge({
  isPublic,
  likeCount = 0,
  onToggle,
}: PublicStatusBadgeProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <XStack alignItems="center" gap="$3">
      {/* Status */}
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.badge,
          {
            backgroundColor: isPublic
              ? 'rgba(255, 107, 107, 0.1)'
              : (theme.backgroundSoft?.val ?? '#f5f5f5'),
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <XStack alignItems="center" gap="$1.5">
          {isPublic ? (
            <GlobeIcon size={14} color={accent.primary} />
          ) : (
            <LockIcon size={14} color={theme.colorMuted?.val ?? '#999'} />
          )}
          <Text
            variant="caption"
            color={isPublic ? (accent.primary as any) : '$colorMuted'}
            style={{ fontSize: 12 }}
          >
            {isPublic ? t('publicToggle.publicStatus') : t('publicToggle.privateStatus')}
          </Text>
        </XStack>
      </Pressable>

      {/* Like count (only when public) */}
      {isPublic && likeCount > 0 && (
        <XStack alignItems="center" gap="$1">
          <HeartIcon size={12} color="#FF6B6B" filled />
          <Text variant="caption" color="#FF6B6B" style={{ fontSize: 12 }}>
            {likeCount}
          </Text>
        </XStack>
      )}
    </XStack>
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
