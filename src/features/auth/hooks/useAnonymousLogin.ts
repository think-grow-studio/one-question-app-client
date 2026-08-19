import { useMutation } from '@tanstack/react-query';
import { signInAnonymously, logEvent, AnalyticsEvents } from '@/platform/firebase';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export function useAnonymousLogin() {
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async () => {
      logEvent(AnalyticsEvents.LOGIN_START, { method: 'guest' });
      const idToken = await signInAnonymously();
      const { data } = await authApi.anonymousLogin({ idToken });
      return data;
    },
    onSuccess: async (data) => {
      logEvent(AnalyticsEvents.LOGIN, { method: 'guest' });
      await login(data.accessToken, data.refreshToken);
    },
    onError: () => {
      logEvent(AnalyticsEvents.LOGIN_FAIL, { method: 'guest', reason: 'error' });
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
