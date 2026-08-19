import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import { APP_STORE_URLS } from '@/constants/appStoreUrls';

export async function requestAppReview(): Promise<boolean> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    const hasAction = await StoreReview.hasAction();
    console.log('[AppReview] isAvailable:', isAvailable, 'hasAction:', hasAction);

    if (isAvailable) {
      await StoreReview.requestReview();
      return true;
    }

    if (hasAction) {
      await StoreReview.requestReview();
      return true;
    }

    // Fallback: in-app review가 불가하면 스토어 페이지로 유도.
    const url = Platform.OS === 'ios' ? APP_STORE_URLS.ios : APP_STORE_URLS.android;
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('[AppReview] Error:', error);
    return false;
  }
}
