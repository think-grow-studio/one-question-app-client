import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/layout/Screen';
import { CommonQuestionFeed } from '@/features/feed/components/CommonQuestionFeed';
import { FloatingActionButton } from '@/shared/ui/FloatingActionButton';
import { InfoIcon } from '@/shared/icons/InfoIcon';
import { useDailyPublicQuestion } from '@/features/feed/hooks/queries/usePublicQuestionQueries';
import { getServiceToday } from '@/features/feed/utils/feedUtils';
import { cs } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

  // FAB 라벨/액션은 항상 "오늘" PDQ 기준 (과거 날짜를 보더라도 작성/수정 대상은 오늘 답변).
  // CommonQuestionFeed 내부의 selectedDate 와 같은 today queryKey 면 in-flight dedup 됨.
  const today = getServiceToday();
  const todayQuery = useDailyPublicQuestion(today);
  const todayPdq = todayQuery.data;
  const hasAnswered = Boolean(todayPdq?.myAnswer);

  const handleWrite = () => {
    if (!todayPdq) return;
    router.push({
      pathname: '/answer',
      params: {
        source: 'feed',
        pdqId: String(todayPdq.publicDailyQuestionId),
        date: today,
        question: todayPdq.content,
        description: todayPdq.description ?? '',
      },
    });
  };

  // TODO: 튜토리얼 안내 모달 연결
  const handleShowGuide = () => {
    // intentionally empty — UI only for now
  };

  return (
    <Screen edges={['top']} bgColor={theme.backgroundSoft?.val}>
      <YStack flex={1}>
        {/* Guide trigger — top-right only */}
        <XStack style={styles.header} jc="flex-end">
          <Pressable
            onPress={handleShowGuide}
            accessibilityRole="button"
            accessibilityLabel={t('infoButtonA11y')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.infoButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <InfoIcon size={cs(20)} color={theme.colorMuted?.val ?? '#888'} />
          </Pressable>
        </XStack>

        {/* Common Question + Answers */}
        <CommonQuestionFeed />
      </YStack>

      {/* Floating Write Button — hidden once answered (edit is in the card) */}
      {!hasAnswered ? (
        <FloatingActionButton
          onPress={handleWrite}
          aboveTabBar
          label={t('writeButton')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 헤더는 UI chrome 이라 의도적으로 raw dp 사용 (큰 화면에서 헤더만 부풀어 오르는 걸 방지).
  // 콘텐츠 영역은 반응형 sp()/cs() 사용.
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoButton: {
    padding: 6,
  },
});
