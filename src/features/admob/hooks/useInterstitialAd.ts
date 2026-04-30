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
  // showAdAndWait가 대기 중일 때 CLOSED/ERROR 시 resolve할 핸들.
  // useEffect의 단일 CLOSED 리스너에서 통일 처리해 ad.load() 중복 호출과
  // 분석 이벤트 중복 로깅을 방지함.
  const pendingResolveRef = useRef<((result: { success: boolean }) => void) | null>(null);

  const settlePending = (result: { success: boolean }) => {
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    resolve?.(result);
  };

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
          // 표시 시도 중 ERROR가 나면 대기 중인 showAdAndWait도 풀어줘야 함
          settlePending({ success: false });
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          isLoadedRef.current = false;
          logEvent(AnalyticsEvents.INTERSTITIAL_AD_CLOSE, { placement: adUnitKey });
          ad.load();
          settlePending({ success: true });
        })
      );
      ad.load();
    };

    init();
    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
      // 언마운트 시 hanging promise 방지
      settlePending({ success: false });
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
    // 이미 표시 중이면 통과 처리 (중첩 호출 방지)
    if (pendingResolveRef.current) return { success: true };

    logEvent(AnalyticsEvents.INTERSTITIAL_AD_SHOW, { placement: adUnitKey });

    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      ad.show().catch(() => {
        // present 실패 시: useEffect의 CLOSED는 발화 안하므로 여기서 직접 해제
        settlePending({ success: true });
      });
    });
  }, [adUnitKey]);

  return { showAd, showAdAndWait };
}
