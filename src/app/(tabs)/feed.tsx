import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { CommonQuestionFeed } from '@/features/feed/components/CommonQuestionFeed';
import { FeedTutorial } from '@/features/feed/components/FeedTutorial';
import { useFeedTutorialStore } from '@/features/feed/stores/useFeedTutorialStore';
import { InfoIcon } from '@/shared/icons/InfoIcon';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { cs } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const isAdFreeMember = useIsAdFreeMember();

  const hasSeenFeedTutorial = useFeedTutorialStore((s) => s.hasSeenFeedTutorial);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [hydrated, setHydrated] = useState(() => useFeedTutorialStore.persist.hasHydrated());

  useEffect(() => {
    logScreenView('Feed');
  }, []);

  // zustand persist는 비동기 hydration. hydration 완료 전까지 hasSeenFeedTutorial=false 라
  // 가드 없으면 첫 진입에서 깜빡임 발생. hasHydrated()/onFinishHydration 로 게이트.
  useEffect(() => {
    if (hydrated) return;
    const unsub = useFeedTutorialStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasSeenFeedTutorial) {
      setTutorialVisible(true);
    }
  }, [hydrated, hasSeenFeedTutorial]);

  const handleShowGuide = () => {
    setTutorialVisible(true);
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

        {/* Common Question + Answers (FAB 포함 — selectedDate 기반) */}
        <CommonQuestionFeed />
      </YStack>

      {!isAdFreeMember && <BannerAdSlot disableSafeAreaPadding />}

      <FeedTutorial visible={tutorialVisible} onClose={() => setTutorialVisible(false)} />
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
