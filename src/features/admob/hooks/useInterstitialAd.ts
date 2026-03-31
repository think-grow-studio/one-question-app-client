import { useCallback, useEffect, useRef } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '../config/adUnits';
import { admobInitPromise } from '../config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type AdUnitKey = 'interstitialSwipe' | 'interstitialPastQuestion' | 'interstitialReload';

/**
 * 통합 전면 광고 훅
 * - showAd(): fire-and-forget (비차단)
 * - showAdAndWait(): 광고 닫힐 때까지 대기 후 진행 (차단)
 * - 광고 미로드 시 두 함수 모두 블로킹 없이 통과
 */
export function useInterstitialAd(adUnitKey: AdUnitKey) {
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
        admobUnitIds[adUnitKey],
        admobRequestOptions
      );
      adRef.current = ad;

      unsubscribers.push(
        ad.addAdEventListener(AdEventType.LOADED, () => {
          isLoadedRef.current = true;
        }),
        ad.addAdEventListener(AdEventType.ERROR, (error) => {
          if (__DEV__) console.warn(`[useInterstitialAd:${adUnitKey}] Ad load error:`, error);
          isLoadedRef.current = false;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          isLoadedRef.current = false;
          logEvent(AnalyticsEvents.INTERSTITIAL_AD_CLOSE, { placement: adUnitKey });
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
  }, [adUnitKey]);

  // fire-and-forget
  const showAd = useCallback(async (): Promise<void> => {
    if (!isAdMobSupportedPlatform) return;
    const ad = adRef.current;
    if (!ad || !isLoadedRef.current) return;

    logEvent(AnalyticsEvents.INTERSTITIAL_AD_SHOW, { placement: adUnitKey });
    try {
      await ad.show();
    } catch {
      // 표시 실패는 무시
    }
  }, [adUnitKey]);

  // 광고 닫힐 때까지 대기
  const showAdAndWait = useCallback(async (): Promise<{ success: boolean }> => {
    if (!isAdMobSupportedPlatform) return { success: true };
    const ad = adRef.current;
    if (!ad || !isLoadedRef.current) return { success: true };

    logEvent(AnalyticsEvents.INTERSTITIAL_AD_SHOW, { placement: adUnitKey });

    return new Promise((resolve) => {
      const closedListener = ad.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          closedListener();
          isLoadedRef.current = false;
          logEvent(AnalyticsEvents.INTERSTITIAL_AD_CLOSE, { placement: adUnitKey });
          ad.load();
          resolve({ success: true });
        }
      );

      ad.show().catch(() => {
        closedListener();
        isLoadedRef.current = false;
        ad.load();
        resolve({ success: true });
      });
    });
  }, [adUnitKey]);

  return { showAd, showAdAndWait };
}
