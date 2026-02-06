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

type BannerAdSlotProps = {
  hidden?: boolean;
  disableSafeAreaPadding?: boolean;
};

export const BannerAdSlot = memo(function BannerAdSlot({ hidden, disableSafeAreaPadding }: BannerAdSlotProps) {
  const insets = useSafeAreaInsets();
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;
    admobInitPromise.then((ok) => setSdkReady(ok));
  }, []);

  if (hidden || !isAdMobSupportedPlatform || !sdkReady) {
    return null;
  }

  return (
    <View style={[styles.container, !disableSafeAreaPadding && { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <BannerAd
        unitId={admobUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={admobRequestOptions}
        onAdLoaded={() => { if (__DEV__) console.log('[BannerAd] Loaded'); }}
        onAdFailedToLoad={(error) => { if (__DEV__) console.warn('[BannerAd] Failed:', error); }}
      />
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
