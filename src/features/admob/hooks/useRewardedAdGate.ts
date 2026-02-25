import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import {
  admobRequestOptions,
  admobUnitIds,
  isAdMobSupportedPlatform,
} from '../config/adUnits';
import { admobInitPromise } from '../config/adInit';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

type RewardResult = {
  success: boolean;
};

const AD_LOAD_TIMEOUT_MS = 10000;

/**
 * 광고 로드가 완료될 때까지 대기하는 헬퍼 함수
 */
function waitForAdLoad(rewarded: RewardedAd, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      loadedListener();
      errorListener();
    };

    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(true);
        }
      }
    );

    const errorListener = rewarded.addAdEventListener(
      AdEventType.ERROR,
      () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }
    );

    // 타임아웃 처리
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, timeoutMs);

    // 광고 로드 시작
    rewarded.load();
  });
}

export function useRewardedAdGate() {
  const adRef = useRef<RewardedAd | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;

    let cancelled = false;

    const init = async () => {
      // SDK 초기화 완료 대기
      const initialized = await admobInitPromise;
      if (cancelled || !initialized) return;

      const rewarded = RewardedAd.createForAdRequest(
        admobUnitIds.rewarded,
        admobRequestOptions
      );

      adRef.current = rewarded;

      const unsubscribeLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          setIsLoaded(true);
          setIsLoading(false);
        }
      );

      const unsubscribeError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          if (__DEV__) console.warn('[useRewardedAdGate] Ad load error:', error);
          setIsLoaded(false);
          setIsLoading(false);
        }
      );

      cleanupRef.current = () => {
        unsubscribeLoaded();
        unsubscribeError();
      };

      rewarded.load();
    };

    init();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  const requestReward = useCallback(async (): Promise<RewardResult> => {
    if (!isAdMobSupportedPlatform) {
      return { success: true };
    }

    const rewarded = adRef.current;
    if (!rewarded) {
      return { success: false };
    }

    // Analytics: 리워드 광고 요청
    logEvent(AnalyticsEvents.REWARDED_AD_REQUEST);

    if (!isLoaded) {
      setIsLoading(true);
      const loadSuccess = await waitForAdLoad(rewarded, AD_LOAD_TIMEOUT_MS);
      setIsLoading(false);

      if (!loadSuccess) {
        if (__DEV__) console.warn('[useRewardedAdGate] Ad failed to load within timeout');
        // Analytics: 리워드 광고 건너뛰기/실패
        logEvent(AnalyticsEvents.REWARDED_AD_SKIP, {
          reason: 'load_timeout',
        });
        return { success: false };
      }
    }

    return new Promise<RewardResult>((resolve) => {
      let rewardEarned = false;

      const rewardListener = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewardEarned = true;
          // Analytics: 리워드 광고 시청 완료
          logEvent(AnalyticsEvents.REWARDED_AD_VIEW);
        }
      );

      const closedListener = rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          rewardListener();
          closedListener();
          setIsLoaded(false);
          rewarded.load();

          // Analytics: 시청하지 않고 닫음
          if (!rewardEarned) {
            logEvent(AnalyticsEvents.REWARDED_AD_SKIP, {
              reason: 'closed_early',
            });
          }

          resolve({ success: rewardEarned });
        }
      );

      rewarded.show().catch(() => {
        rewardListener();
        closedListener();
        setIsLoaded(false);
        rewarded.load();
        // Analytics: 리워드 광고 표시 실패
        logEvent(AnalyticsEvents.REWARDED_AD_SKIP, {
          reason: 'show_failed',
        });
        resolve({ success: false });
      });
    });
  }, [isLoaded]);

  return {
    requestReward,
    isLoaded,
    isLoading,
    isSupported: isAdMobSupportedPlatform,
  };
}
