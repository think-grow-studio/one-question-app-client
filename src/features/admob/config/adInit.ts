import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { isAdMobSupportedPlatform } from './adUnits';

/**
 * iOS에서만 ATT(App Tracking Transparency) 권한 요청.
 * - iOS 14.5+ 에서 IDFA 접근 전 필수 (미요청 시 광고 fill 저하/실패)
 * - 시스템이 결과를 캐싱하므로 두 번째 호출부터는 프롬프트 없이 저장된 상태만 반환
 * - Android/web에서는 항상 granted로 즉시 반환되어 no-op (분기 불필요하지만 명시적으로 건너뜀)
 */
async function requestATTIfNeeded(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    await requestTrackingPermissionsAsync();
  } catch (error) {
    if (__DEV__) {
      console.warn('[ATT] Permission request failed:', error);
    }
  }
}

/**
 * AdMob SDK 초기화 (모듈 레벨에서 1회 실행)
 * - iOS: ATT 프롬프트 → SDK 초기화 (IDFA 사용 가능 상태 확보 후)
 * - Android: ATT 단계 건너뛰고 바로 SDK 초기화
 */
export const admobInitPromise: Promise<boolean> = isAdMobSupportedPlatform
  ? (async () => {
      try {
        await requestATTIfNeeded();

        await mobileAds().setRequestConfiguration({
          testDeviceIdentifiers: [
            'EMULATOR',
            '1AA71683D3B0DD450FF6F68CE236AC37', // debug build
            '4D58ED45A1C6473D6C2D47DFCE3327F1', // preview/release build
          ],
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
