import mobileAds from 'react-native-google-mobile-ads';
import { isAdMobSupportedPlatform } from './adUnits';

/**
 * AdMob SDK 초기화 (모듈 레벨에서 1회 실행)
 * - 개발 모드: 테스트 기기 등록하여 실제 ID로 테스트 광고 수신
 * - 프로덕션: 일반 초기화
 */
export const admobInitPromise: Promise<boolean> = isAdMobSupportedPlatform
  ? (async () => {
      try {
        await mobileAds().setRequestConfiguration({
          testDeviceIdentifiers: ['EMULATOR', '4D58ED45A1C6473D6C2D47DFCE3327F1'],
        });
        await mobileAds().initialize();
        return true;
      } catch (error) {
        if (__DEV__) {
          console.warn('[AdMob] SDK initialization failed:', error);
        }
        return false;
      }
    })()
  : Promise.resolve(false);
