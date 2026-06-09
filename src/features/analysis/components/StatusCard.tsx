import { Pressable, StyleSheet, View } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useAccentColors } from '@/shared/theme';
import { sp, radius, fs } from '@/shared/utils/responsive';

type StatusVariant = 'locked' | 'cooldown' | 'processing' | 'failed';

interface StatusCardProps {
  variant: StatusVariant;
  /** locked: 현재 답변 수 */
  current?: number;
  /** locked: 필요 답변 수 */
  required?: number;
  /** cooldown: 다음 분석까지 남은 일 수 */
  days?: number;
  /** processing 카드 탭(진행 상황 보기) / failed 재시도 */
  onPress?: () => void;
}

const EMOJI: Record<StatusVariant, string> = {
  locked: '🌱',
  cooldown: '🌙',
  processing: '✨',
  failed: '😶‍🌫️',
};

export function StatusCard({ variant, current = 0, required = 10, days = 0, onPress }: StatusCardProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('analysis');

  const title = t(`status.${variant}.title`);
  const message =
    variant === 'locked'
      ? t('status.locked.message', { required })
      : variant === 'cooldown'
        ? t('status.cooldown.message', { days })
        : t(`status.${variant}.message`);

  const progress = required > 0 ? Math.min(1, current / required) : 0;

  const body = (
    <YStack
      style={[styles.card, { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val }]}
      gap="$2"
    >
      <Text variant="label" style={styles.title}>
        {EMOJI[variant]}  {title}
      </Text>
      <Text variant="bodySmall" muted>
        {message}
      </Text>

      {variant === 'locked' && (
        <YStack gap="$2" mt="$1">
          <View style={[styles.track, { backgroundColor: theme.backgroundSoft?.val }]}>
            <View
              style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent.primary }]}
            />
          </View>
          <Text variant="caption">{t('status.locked.progress', { current, required })}</Text>
        </YStack>
      )}

      {variant === 'cooldown' && (
        <Text variant="caption" mt="$1">
          {t('status.cooldown.hint')}
        </Text>
      )}

      {variant === 'processing' && (
        <View style={styles.shimmerRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.shimmerDot,
                { backgroundColor: i < 3 ? accent.primary : theme.backgroundSoft?.val },
              ]}
            />
          ))}
        </View>
      )}

      {(variant === 'processing' || variant === 'failed') && onPress && (
        <Text variant="label" mt="$2" style={{ color: accent.primary }}>
          {variant === 'processing' ? t('status.processing.view') : t('status.failed.retry')} →
        </Text>
      )}
    </YStack>
  );

  if (onPress && (variant === 'processing' || variant === 'failed')) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius(20),
    borderWidth: StyleSheet.hairlineWidth,
    padding: sp(18),
  },
  title: {
    fontSize: fs(16),
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  shimmerRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: sp(8),
  },
  shimmerDot: {
    width: 22,
    height: 6,
    borderRadius: 3,
  },
});
