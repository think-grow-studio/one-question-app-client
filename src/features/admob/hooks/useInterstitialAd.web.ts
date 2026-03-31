export function useInterstitialAd(_adUnitKey: string) {
  return {
    showAd: async () => {},
    showAdAndWait: async () => ({ success: true }),
  };
}
