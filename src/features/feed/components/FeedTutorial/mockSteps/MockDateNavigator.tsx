import { StyleSheet, View } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { getFontStyle } from '@/shared/theme/typography';
import { cs, fs, radius, sp } from '@/shared/utils/responsive';

export function MockDateNavigator() {
  const theme = useTheme();
  const arrowColor = theme.color?.val ?? '#000';

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: theme.background?.val ?? '#fff',
          borderColor: theme.borderColor?.val ?? '#e5e7eb',
        },
      ]}
    >
      <XStack alignItems="center" justifyContent="center" gap={sp(10)}>
        <View style={styles.arrow}>
          <BackIcon size={cs(18)} color={arrowColor} />
        </View>
        <Text style={styles.dateText} {...getFontStyle('600')}>
          2026년 5월 27일 화요일
        </Text>
        <View style={[styles.arrow, styles.arrowRight]}>
          <BackIcon size={cs(18)} color={arrowColor} />
        </View>
      </XStack>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    paddingVertical: sp(18),
    paddingHorizontal: sp(20),
    borderRadius: radius(18),
    borderWidth: 1,
  },
  dateText: {
    fontSize: fs(14),
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  arrow: {
    padding: sp(4),
  },
  arrowRight: {
    transform: [{ scaleX: -1 }],
  },
});
