import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Screen } from '@/shared/layout/Screen';
import { CommonQuestionFeed } from '@/features/feed/components/CommonQuestionFeed';
import { FloatingActionButton } from '@/shared/ui/FloatingActionButton';
import { InfoIcon } from '@/shared/icons/InfoIcon';
import {
  MOCK_COMMON_QUESTION,
  MOCK_COMMON_ANSWERS,
} from '@/features/feed/api/__mocks__/commonQuestionMock';
import { formatLocalDate } from '@/shared/utils/date';
import { cs } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

  // TODO: replace with TanStack Query result once the public-feed endpoint lands.
  const myAnswer = useMemo(
    () => MOCK_COMMON_ANSWERS.find((a) => a.mine),
    [],
  );
  const hasAnswered = Boolean(myAnswer);

  const handleWriteOrEdit = () => {
    router.push({
      pathname: '/answer',
      params: {
        source: 'feed',
        date: formatLocalDate(),
        question: MOCK_COMMON_QUESTION.content,
        description: MOCK_COMMON_QUESTION.description ?? '',
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
        <CommonQuestionFeed onMyAnswerPress={handleWriteOrEdit} />
      </YStack>

      {/* Floating Write / Edit Button */}
      <FloatingActionButton
        onPress={handleWriteOrEdit}
        aboveTabBar
        label={t(hasAnswered ? 'editButton' : 'writeButton')}
      />
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
