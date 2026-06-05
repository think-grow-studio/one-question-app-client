import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useAccentColors, getFontStyle, useScreenBackground } from '@/shared/theme';
import { fs, sp, cs, radius } from '@/shared/utils/responsive';
import type { DailyQuestionDomain } from '../domain/questionDomain';

const CURRENT_YEAR = new Date().getFullYear();

/** 답변 미리보기 최대 줄 수 */
const ANSWER_PREVIEW_LINES = 10;

// 커넥터 컬럼 기하 — 세로선/점을 가로 중앙에 절대배치하기 위한 상수
const CONNECTOR_WIDTH = cs(32);
const CONNECTOR_CENTER = CONNECTOR_WIDTH / 2;
const LINE_WIDTH = 2;
const DOT_SIZE = 11;

interface TimelineRowProps {
  item: DailyQuestionDomain;
  onPress: (date: string) => void;
}

/**
 * 타임라인 한 행 — 좌측 날짜 + 세로 연결선 + 점 + 질문/답변 카드.
 * FlashList 아이템이므로 `memo`로 불필요한 리렌더 방지 (§18.1).
 */
export const TimelineRow = memo(function TimelineRow({ item, onPress }: TimelineRowProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('question');
  const screenBg = useScreenBackground();

  const [year, month, day] = item.date.split('-').map(Number);
  const showYear = year !== CURRENT_YEAR;

  return (
    <View style={styles.row}>
      {/* 날짜 컬럼 */}
      <View style={styles.dateColumn}>
        {showYear && (
          <Text style={[styles.yearText, { color: theme.colorSubtle?.val }]}>{year}</Text>
        )}
        <Text style={[styles.dayText, { color: theme.color?.val }]}>{day}</Text>
        <Text style={[styles.monthText, { color: theme.colorSubtle?.val }]}>
          {t('timeline.month', { month })}
        </Text>
      </View>

      {/* 커넥터 (세로선 + 점) */}
      <View style={styles.connectorColumn}>
        <View style={[styles.line, { backgroundColor: theme.borderColor?.val }]} />
        <View
          style={[
            styles.dot,
            // 점 안쪽은 화면 배경색으로 — 세로선을 가려 도넛 모양이 됨
            { backgroundColor: screenBg, borderColor: accent.primary },
          ]}
        />
      </View>

      {/* 카드 */}
      <Pressable
        onPress={() => onPress(item.date)}
        style={[
          styles.card,
          { backgroundColor: theme.surface?.val, borderColor: theme.borderColor?.val },
        ]}
      >
        <View style={[styles.questionRow, !!item.answer?.content && styles.questionRowSpacing]}>
          <Text style={[styles.qBadge, { color: accent.primary }]}>Q.</Text>
          <Text style={[styles.questionText, { color: theme.color?.val }]} numberOfLines={2}>
            {item.question?.content ?? ''}
          </Text>
        </View>
        {/* 미답변이면 답변 영역은 비워둠 (질문만 표시). 답변은 최대 7줄 후 말줄임 */}
        {item.answer?.content ? (
          <Text
            // 답변은 타임라인의 주 콘텐츠 — 질문과 동일한 기본 텍스트 색 사용 (muted는 흐릿함)
            style={[styles.answerText, { color: theme.color?.val }]}
            numberOfLines={ANSWER_PREVIEW_LINES}
          >
            {item.answer.content}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: sp(22),
  },
  dateColumn: {
    width: cs(40),
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  yearText: {
    fontSize: fs(10),
    ...getFontStyle('500'),
    letterSpacing: -0.2,
  },
  dayText: {
    fontSize: fs(20),
    ...getFontStyle('700'),
    lineHeight: fs(22),
    letterSpacing: -0.5,
  },
  monthText: {
    fontSize: fs(11),
    marginTop: 1,
  },
  connectorColumn: {
    width: CONNECTOR_WIDTH,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: -sp(22), // 다음 행과 연결되도록 marginBottom만큼 연장
    left: CONNECTOR_CENTER - LINE_WIDTH / 2,
    width: LINE_WIDTH,
  },
  dot: {
    position: 'absolute',
    top: sp(20), // 카드 첫 질문 줄에 점을 정렬 (카드 상단 패딩 + 줄 중앙)
    left: CONNECTOR_CENTER - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 3,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius(18),
    paddingVertical: sp(20),
    paddingHorizontal: sp(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  questionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  questionRowSpacing: {
    marginBottom: sp(13), // 답변이 있을 때만 질문↔답변 간격 적용
  },
  qBadge: {
    fontSize: fs(14),
    ...getFontStyle('700'),
    lineHeight: fs(22),
  },
  questionText: {
    flex: 1,
    fontSize: fs(14),
    ...getFontStyle('600'),
    lineHeight: fs(22),
    letterSpacing: -0.2,
  },
  answerText: {
    fontSize: fs(13.5),
    lineHeight: fs(23),
    letterSpacing: -0.2,
  },
});
