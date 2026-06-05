import { useCallback, useEffect, useRef } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '../config/adUnits';
import { admobInitPromise } from '../config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type AdUnitKey =
  | 'interstitialSwipe'
  | 'interstitialPastQuestion'
  | 'interstitialPastQuestionTimeline'
  | 'interstitialReload'
  | 'interstitialPublicScroll'
  | 'interstitialPublicPastAnswer';

// showAdAndWait가 호출됐는데 광고가 아직 로드 중이면 LOADED/ERROR 이벤트를
// 잠깐 기다린다. fill이 보통 0.3~1.5초 걸리므로 1500ms면 대부분 잡히고,
// 그 이상은 사용자가 "버튼이 굳었나" 인지하기 시작함 (UX 손익분기점).
const AD_LOAD_WAIT_MS = 1500;

/**
 * 통합 전면 광고 훅
 * - showAd(): fire-and-forget (비차단)
 * - showAdAndWait(): 광고 닫힐 때까지 대기 후 진행 (차단). 미로드 시 짧게 기다린 후
 *   여전히 미로드면 통과
 */
export function useInterstitialAd(adUnitKey: AdUnitKey) {
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);
  // showAdAndWait가 대기 중일 때 CLOSED/ERROR 시 resolve할 핸들.
  // useEffect의 단일 CLOSED 리스너에서 통일 처리해 ad.load() 중복 호출과
  // 분석 이벤트 중복 로깅을 방지함.
  const pendingResolveRef = useRef<((result: { success: boolean }) => void) | null>(null);
  // showAdAndWait가 LOADED를 기다리는 중일 때 깨워줄 waiter들.
  // LOADED/ERROR 발생 시 일괄 resolve.
  const loadWaitersRef = useRef<Array<() => void>>([]);

  const settlePending = (result: { success: boolean }) => {
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    resolve?.(result);
  };

  const drainLoadWaiters = () => {
    const waiters = loadWaitersRef.current;
    loadWaitersRef.current = [];
    waiters.forEach((w) => w());
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
          drainLoadWaiters();
        }),
        ad.addAdEventListener(AdEventType.ERROR, (error) => {
          if (__DEV__) console.warn(`[useInterstitialAd:${adUnitKey}] Ad load error:`, error);
          isLoadedRef.current = false;
          // ERROR 시점에 대기 중인 waiter도 풀어줘야 1.5s 다 못 채우고 즉시 skip 가능
          drainLoadWaiters();
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
      drainLoadWaiters();
      settlePending({ success: false });
    };
  }, [adUnitKey]);

  // fire-and-forget
  const showAd = useCallback(async (): Promise<void> => {
    if (!isAdMobSupportedPlatform) return;
    const ad = adRef.current;
    if (!ad || !isLoadedRef.current) {
      logEvent(AnalyticsEvents.INTERSTITIAL_AD_SKIPPED, {
        placement: adUnitKey,
        reason: ad ? 'not_loaded' : 'no_instance',
      });
      return;
    }

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
    if (!ad) {
      logEvent(AnalyticsEvents.INTERSTITIAL_AD_SKIPPED, {
        placement: adUnitKey,
        reason: 'no_instance',
      });
      return { success: true };
    }

    // 미로드면 LOADED/ERROR 이벤트나 timeout까지 대기 후 재확인
    if (!isLoadedRef.current) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        loadWaitersRef.current.push(settle);
        setTimeout(settle, AD_LOAD_WAIT_MS);
      });

      if (!isLoadedRef.current) {
        logEvent(AnalyticsEvents.INTERSTITIAL_AD_SKIPPED, {
          placement: adUnitKey,
          reason: 'wait_timeout',
        });
        return { success: true };
      }
    }

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
