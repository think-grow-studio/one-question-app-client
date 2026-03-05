import { useCallback, useEffect, useRef } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '../config/adUnits';
import { admobInitPromise } from '../config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

export function useInterstitialAdGate() {
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    const init = async () => {
      const initialized = await admobInitPromise;
      if (cancelled || !initialized) return;

      const ad = InterstitialAd.createForAdRequest(
        admobUnitIds.interstitial,
        admobRequestOptions
      );
      adRef.current = ad;

      unsubscribers.push(
        ad.addAdEventListener(AdEventType.LOADED, () => {
          isLoadedRef.current = true;
        }),
        ad.addAdEventListener(AdEventType.ERROR, () => {
          isLoadedRef.current = false;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          isLoadedRef.current = false;
          logEvent(AnalyticsEvents.INTERSTITIAL_AD_CLOSE);
          ad.load();
        })
      );
      ad.load();
    };

    init();
    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
    };
  }, []);

  const showAd = useCallback(async (): Promise<void> => {
    if (!isAdMobSupportedPlatform) return;
    const ad = adRef.current;
    if (!ad || !isLoadedRef.current) return;

    logEvent(AnalyticsEvents.INTERSTITIAL_AD_SHOW);
    try {
      await ad.show();
    } catch {
      // 표시 실패는 무시
    }
  }, []);

  return { showAd };
}
