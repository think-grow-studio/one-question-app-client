import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from 'tamagui';
import { Screen } from '@/shared/layout/Screen';
import { PublicAnswerDetail } from '@/features/feed/components/PublicAnswerDetail';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { logScreenView } from '@/services/firebase';

export default function PublicAnswerDetailScreen() {
  const theme = useTheme();
  const isAdFreeMember = useIsAdFreeMember();
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

      {!isAdFreeMember && <BannerAdSlot disableSafeAreaPadding />}
    </Screen>
  );
}
