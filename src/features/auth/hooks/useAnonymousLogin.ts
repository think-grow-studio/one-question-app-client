import { useMutation } from '@tanstack/react-query';
import { signInAnonymously } from '@/services/firebase';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export function useAnonymousLogin() {
  const { login } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async () => {
      const idToken = await signInAnonymously();
      const { data } = await authApi.anonymousLogin({ idToken });
      return data;
    },
    onSuccess: async (data) => {
      await login(data.accessToken, data.refreshToken);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
