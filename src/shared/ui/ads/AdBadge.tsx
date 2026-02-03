import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { fs, sp, radius } from '@/utils/responsive';

type AdBadgeProps = {
  size?: 'default' | 'compact';
};

export const AdBadge = memo(function AdBadge({ size = 'default' }: AdBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const isCompact = size === 'compact';

  return (
    <View
      style={[
        styles.badge,
        isCompact && styles.compactBadge,
        {
          backgroundColor: theme.backgroundSoft?.val,
          borderColor: theme.borderColor?.val,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          isCompact && styles.compactText,
          { color: theme.colorMuted?.val },
        ]}
      >
        {t('ads.adLabel')}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius(8),
    paddingHorizontal: sp(8),
    paddingVertical: sp(2),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    fontSize: fs(11),
  },
  compactBadge: {
    paddingHorizontal: sp(5),
    paddingVertical: sp(1),
  },
  compactText: {
    fontSize: fs(9),
  },
});
