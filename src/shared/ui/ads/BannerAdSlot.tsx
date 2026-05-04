import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '@/features/admob/config/adUnits';
import { admobInitPromise } from '@/features/admob/config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type BannerAdSlotProps = {
  hidden?: boolean;
  disableSafeAreaPadding?: boolean;
};

// ANCHORED_ADAPTIVE_BANNER 일반 폰 portrait 기본 높이.
// SDK 초기화 / 광고 로드 비동기 동안 placeholder 로 같은 높이를 점유시켜
// 부모 레이아웃의 위/아래 jitter 방지. (태블릿은 ~90까지 갈 수 있어
// 그 케이스에서 미세한 shift는 잔존 — 필요 시 Platform.isPad 분기 추가)
const RESERVED_BANNER_HEIGHT = 50;

export const BannerAdSlot = memo(function BannerAdSlot({ hidden, disableSafeAreaPadding }: BannerAdSlotProps) {
  const insets = useSafeAreaInsets();
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;
    admobInitPromise.then((ok) => setSdkReady(ok));
  }, []);

  if (hidden || !isAdMobSupportedPlatform) {
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
    justifyContent: 'center',
  },
});
