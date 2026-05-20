import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { BackIcon } from '@/shared/icons/BackIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, cs } from '@/shared/utils/responsive';
import { AnswerCard } from './AnswerCard';
import { MOCK_COMMON_QUESTION, MOCK_COMMON_ANSWERS } from '../api/__mocks__/commonQuestionMock';
import type { FeedItemDomain } from '../types/api';

interface CommonQuestionFeedProps {
  /** Optional: pass real data later. Falls back to mock data when omitted. */
  question?: { content: string; description?: string | null };
  answers?: FeedItemDomain[];
}

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatQuestionDate(date: Date, lang: string, weekdays: string[]): string {
  const wd = weekdays[date.getDay()] ?? '';
  if (lang.startsWith('ko')) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${wd})`;
  }
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${wd})`;
}

export function CommonQuestionFeed({ question, answers }: CommonQuestionFeedProps) {
  const { t, i18n } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();

  const q = question ?? MOCK_COMMON_QUESTION;
  const data = answers ?? MOCK_COMMON_ANSWERS;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const canGoNext = !isSameDay(selectedDate, today);

  const weekdays = useMemo(() => {
    const raw = t('weekdays', { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const dateLabel = formatQuestionDate(selectedDate, i18n.language ?? 'ko', weekdays);

  const handlePrev = () => setSelectedDate((d) => addDays(d, -1));
  const handleNext = () => {
    if (canGoNext) setSelectedDate((d) => addDays(d, 1));
  };

  const arrowColor = theme.color?.val ?? '#000';
  const arrowMutedColor = theme.colorMuted?.val ?? '#bbb';

  const questionCard = (
    <View style={styles.questionWrap}>
      {/* Date navigator */}
      <XStack alignItems="center" justifyContent="center" gap={sp(8)} mb={sp(14)}>
        <Pressable
          onPress={handlePrev}
          hitSlop={12}
          style={({ pressed }) => [
            styles.arrowBtn,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <BackIcon size={cs(18)} color={arrowColor} />
        </Pressable>

        <Text style={styles.dateText} {...getFontStyle('600')}>
          {dateLabel}
        </Text>

        <Pressable
          onPress={handleNext}
          disabled={!canGoNext}
          hitSlop={12}
          style={({ pressed }) => [
            styles.arrowBtn,
            styles.arrowRight,
            { opacity: !canGoNext ? 0.35 : pressed ? 0.5 : 1 },
          ]}
        >
          <BackIcon size={cs(18)} color={canGoNext ? arrowColor : arrowMutedColor} />
        </Pressable>
      </XStack>

      <Text style={styles.questionText} {...getFontStyle('600')}>
        <Text style={[styles.qBadge, { color: accent.primary }]} {...getFontStyle('700')}>
          Q.{' '}
        </Text>
        {q.content}
      </Text>

      {q.description ? (
        <Text muted style={styles.questionDesc}>
          {q.description}
        </Text>
      ) : null}

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.borderColor?.val ?? '#eee' },
        ]}
      />
    </View>
  );

  return (
    <YStack flex={1}>
      {/* Fixed question card */}
      {questionCard}

      {/* Scrollable answers */}
      {data.length === 0 ? (
        <YStack flex={1} justifyContent="center" alignItems="center" gap={sp(8)} px={sp(16)}>
          <Text variant="body" muted center>
            {t('empty')}
          </Text>
          <Text variant="caption" muted center>
            {t('emptyDesc')}
          </Text>
        </YStack>
      ) : (
        <View style={styles.listWrap}>
          <FlashList<FeedItemDomain>
            data={data}
            renderItem={({ item }) => <AnswerCard item={item} />}
            keyExtractor={(item) => String(item.answerPostId)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  questionWrap: {
    paddingHorizontal: sp(24),
    paddingTop: sp(12),
    paddingBottom: sp(4),
    alignItems: 'center',
  },
  qBadge: {
    fontSize: fs(17),
    letterSpacing: -0.3,
  },
  arrowBtn: {
    padding: sp(4),
  },
  arrowRight: {
    transform: [{ scaleX: -1 }],
  },
  dateText: {
    fontSize: fs(13),
    letterSpacing: -0.2,
    minWidth: cs(140),
    textAlign: 'center',
  },
  questionText: {
    fontSize: fs(15),
    lineHeight: fs(22),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  questionDesc: {
    marginTop: sp(6),
    fontSize: fs(11),
    lineHeight: fs(16),
    textAlign: 'center',
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginTop: sp(18),
    opacity: 0.6,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: sp(4),
    paddingBottom: sp(32),
  },
});
