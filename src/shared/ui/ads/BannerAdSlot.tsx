import { memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '@/features/admob/config/adUnits';
import { admobInitPromise } from '@/features/admob/config/adInit';
import { useIsAdFreeMember } from '@/features/member/hooks/queries/useMemberQueries';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type BannerAdSlotProps = {
  hidden?: boolean;
  disableSafeAreaPadding?: boolean;
};

// ANCHORED_ADAPTIVE_BANNER placeholder 높이.
// 실제 배너 높이는 deviceHeight에 비례해 50~90dp 범위에서 변동 — 단말마다 다름.
// SDK 초기화 / 광고 로드 비동기 동안 placeholder 로 같은 높이를 점유시켜 jitter 방지.
// iOS는 14/15/Pro Max 등에서 60-65dp 가까이 나와 50으로는 부족 → 65로 상향.
// Android는 검증 단말에서 50dp로 jitter 없음 확인.
// 태블릿(~90dp)은 여전히 미세 shift 잔존 — 필요 시 Device.deviceType 분기 추가.
const RESERVED_BANNER_HEIGHT = Platform.OS === 'ios' ? 65 : 50;

export const BannerAdSlot = memo(function BannerAdSlot({ hidden, disableSafeAreaPadding }: BannerAdSlotProps) {
  const insets = useSafeAreaInsets();
  const [sdkReady, setSdkReady] = useState(false);
  // 회원의 ad-free 여부는 컴포넌트 내부에서 체크 → 호출자가 `!isAdFreeMember && <BannerAdSlot/>`
  // 패턴을 반복하지 않도록 캡슐화. ad-free 회원에겐 placeholder 공간도 차지하지 않게 즉시 null.
  const isAdFreeMember = useIsAdFreeMember();

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;
    admobInitPromise.then((ok) => setSdkReady(ok));
  }, []);

  if (hidden || isAdFreeMember || !isAdMobSupportedPlatform) {
    return null;
  }

  const padding = disableSafeAreaPadding ? 0 : Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: padding,
          minHeight: RESERVED_BANNER_HEIGHT + padding,
        },
      ]}
      pointerEvents="box-none"
    >
      {sdkReady && (
        <BannerAd
          unitId={admobUnitIds.banner}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={admobRequestOptions}
          onAdLoaded={() => {
            if (__DEV__) console.log('[BannerAd] Loaded');
            // Analytics: 배너 광고 노출
            logEvent(AnalyticsEvents.AD_IMPRESSION, {
              ad_type: 'banner',
            });
          }}
          onAdFailedToLoad={(error) => { if (__DEV__) console.warn('[BannerAd] Failed:', error); }}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    // 실제 광고가 RESERVED_BANNER_HEIGHT보다 작을 때 남는 공간이 위/아래로
    // 분배되며 tab bar 사이에 미세한 틈이 생기는 것을 방지. 광고를 하단에
    // 붙여 잉여 공간이 위쪽(콘텐츠와의 간격)으로만 가도록 함.
    justifyContent: 'flex-end',
  },
});
