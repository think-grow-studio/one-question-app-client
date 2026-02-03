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
      rewarded.load();
      return { success: false };
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
