import { useCallback, useEffect, useRef } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '../config/adUnits';
import { admobInitPromise } from '../config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type GateResult = {
  success: boolean;
};

/**
 * 전면 광고 게이트 훅 (기존 보상형 광고 대체)
 * - 광고가 로드되어 있으면 전면 광고를 보여주고, 닫힌 후 진행
 * - 광고가 로드되지 않았으면 바로 진행 (유저를 블로킹하지 않음)
 */
export function useRewardedAdGate() {
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;

    let cancelled = false;

    const init = async () => {
      const initialized = await admobInitPromise;
      if (cancelled || !initialized) return;

      const ad = InterstitialAd.createForAdRequest(
        admobUnitIds.interstitial,
        admobRequestOptions
      );

      adRef.current = ad;

      const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        isLoadedRef.current = true;
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        if (__DEV__) console.warn('[useRewardedAdGate] Ad load error:', error);
        isLoadedRef.current = false;
      });

      cleanupRef.current = () => {
        unsubLoaded();
        unsubError();
      };

      ad.load();
    };

    init();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  const requestReward = useCallback(async (): Promise<GateResult> => {
    if (!isAdMobSupportedPlatform) {
      return { success: true };
    }

    const ad = adRef.current;
    if (!ad || !isLoadedRef.current) {
      // 광고가 로드되지 않았으면 블로킹하지 않고 바로 진행
      return { success: true };
    }

    logEvent(AnalyticsEvents.INTERSTITIAL_AD_SHOW);

    return new Promise<GateResult>((resolve) => {
      const closedListener = ad.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          closedListener();
          isLoadedRef.current = false;
          logEvent(AnalyticsEvents.INTERSTITIAL_AD_CLOSE);
          ad.load(); // 다음 사용을 위해 미리 로드
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
  }, []);

  return {
    requestReward,
    isLoaded: false,
    isLoading: false,
    isSupported: isAdMobSupportedPlatform,
  };
}
