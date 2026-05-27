import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { PublicAnswerDetail } from '@/features/feed/components/PublicAnswerDetail';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { logScreenView } from '@/services/firebase';

export default function PublicAnswerDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    pdqId: string;
    date: string;
  }>();

  useEffect(() => {
    logScreenView('PublicAnswerDetail');
  }, []);

  const answerPostId = Number(params.id);
  const pdqId = Number(params.pdqId);
  const date = params.date;

  return (
    <Screen edges={['top']} bgColor={theme.backgroundSoft?.val}>
      <PublicAnswerDetail
        answerPostId={answerPostId}
        pdqId={pdqId}
        date={date}
      />

      {/* 탭바가 없는 stack push 화면이라 BannerAdSlot 이 직접 bottom safe area 를
          처리하도록 `disableSafeAreaPadding` 미적용. 탭 화면은 탭바가 safe area 를
          담당하므로 disable, 이 화면은 자체 처리. */}
      <BannerAdSlot />
    </Screen>
  );
}
