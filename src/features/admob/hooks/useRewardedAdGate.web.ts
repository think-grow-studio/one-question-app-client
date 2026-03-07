export function useRewardedAdGate() {
  return {
    requestReward: async () => ({ success: true as const }),
    isLoaded: false,
    isLoading: false,
    isSupported: false,
  };
}
