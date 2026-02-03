import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '@/features/admob/config/adUnits';

type BannerAdSlotProps = {
  hidden?: boolean;
  disableSafeAreaPadding?: boolean;
};

export const BannerAdSlot = memo(function BannerAdSlot({ hidden, disableSafeAreaPadding }: BannerAdSlotProps) {
  const insets = useSafeAreaInsets();

  if (hidden || !isAdMobSupportedPlatform) {
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
