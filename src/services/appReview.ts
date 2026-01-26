import * as StoreReview from 'expo-store-review';

export async function requestAppReview(): Promise<boolean> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();

    if (!isAvailable) {
      const hasAction = await StoreReview.hasAction();
      if (hasAction) {
        await StoreReview.requestReview();
        return true;
      }
      return false;
    }

    await StoreReview.requestReview();
    return true;
  } catch (error) {
    console.error('[AppReview] Error:', error);
    return false;
  }
}
