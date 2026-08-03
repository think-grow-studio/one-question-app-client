import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/useAuthStore';

/**
 * 회원탈퇴 Mutation
 * - DELETE /api/v1/auth/me 호출 (서버가 fcm_token row도 함께 정리)
 * - 성공 시 cleanupLocalAuth로 로컬 세션만 정리하고 로그인 화면으로 이동.
 *   logout()을 호출하지 않는 이유: 서버가 이미 fcm 토큰을 삭제했으므로
 *   deleteFcmToken(beforeServerLogout)을 또 부를 이유가 없다.
 */
export function useWithdrawMutation() {
  const router = useRouter();
  const cleanupLocalAuth = useAuthStore((state) => state.cleanupLocalAuth);

  return useMutation({
    mutationFn: authApi.withdraw,
    onSuccess: async () => {
      await cleanupLocalAuth();
      router.replace('/(auth)/login');
    },
  });
}
