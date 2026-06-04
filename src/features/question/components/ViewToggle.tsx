import { StyleSheet, Pressable, View, Platform } from 'react-native';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useAccentColors } from '@/shared/theme';
import { CardViewIcon } from '@/shared/icons/CardViewIcon';
import { TimelineViewIcon } from '@/shared/icons/TimelineViewIcon';
import { cs, radius } from '@/shared/utils/responsive';
import type { HomeView } from '../stores/useHomeViewStore';

interface ViewToggleProps {
  view: HomeView;
  onChange: (view: HomeView) => void;
}

const OPTIONS: { key: HomeView; Icon: typeof CardViewIcon; a11yKey: string }[] = [
  { key: 'card', Icon: CardViewIcon, a11yKey: 'viewToggle.card' },
  { key: 'timeline', Icon: TimelineViewIcon, a11yKey: 'viewToggle.timeline' },
];

/** 홈 헤더의 카드/타임라인 뷰 전환 세그먼트 컨트롤 */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('question');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSoft?.val,
          borderColor: theme.borderColor?.val,
        },
      ]}
    >
      {OPTIONS.map(({ key, Icon, a11yKey }) => {
        const active = view === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(a11yKey)}
            style={[
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: theme.surface?.val }],
            ]}
          >
            <Icon size={18} color={active ? accent.primary : theme.colorSubtle?.val} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    borderWidth: 1,
    borderRadius: radius(11),
    padding: 2,
  },
  segment: {
    width: cs(34),
    height: cs(28),
    borderRadius: radius(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
