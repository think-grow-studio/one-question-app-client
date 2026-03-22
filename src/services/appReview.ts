import * as StoreReview from 'expo-store-review';

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

    return false;
  } catch (error) {
    console.error('[AppReview] Error:', error);
    return false;
  }
}
