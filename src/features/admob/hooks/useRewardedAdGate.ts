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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAdMobSupportedPlatform) return;

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
      () => {
        setIsLoaded(false);
        setIsLoading(false);
      }
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
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

    if (!isLoaded) {
      setIsLoading(true);
      const loadSuccess = await waitForAdLoad(rewarded, AD_LOAD_TIMEOUT_MS);
      setIsLoading(false);

      if (!loadSuccess) {
        console.warn('[useRewardedAdGate] Ad failed to load within timeout');
        return { success: false };
      }
    }

    return new Promise<RewardResult>((resolve) => {
      let rewardEarned = false;

      const rewardListener = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewardEarned = true;
        }
      );

      const closedListener = rewarded.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          rewardListener();
          closedListener();
          setIsLoaded(false);
          rewarded.load();
          resolve({ success: rewardEarned });
        }
      );

      rewarded.show().catch(() => {
        rewardListener();
        closedListener();
        setIsLoaded(false);
        rewarded.load();
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
