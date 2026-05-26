import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { CommonQuestionFeed } from '@/features/feed/components/CommonQuestionFeed';
import { InfoIcon } from '@/shared/icons/InfoIcon';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { cs } from '@/shared/utils/responsive';
import { logScreenView } from '@/services/firebase';

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const isAdFreeMember = useIsAdFreeMember();

  useEffect(() => {
    logScreenView('Feed');
  }, []);

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

        {/* Common Question + Answers (FAB 포함 — selectedDate 기반) */}
        <CommonQuestionFeed />
      </YStack>

      {!isAdFreeMember && <BannerAdSlot disableSafeAreaPadding />}
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
