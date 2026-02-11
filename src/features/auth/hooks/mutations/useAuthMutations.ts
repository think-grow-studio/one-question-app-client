import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * 회원탈퇴 Mutation
 * - DELETE /api/v1/auth/me 호출
 * - 성공 시 자동 로그아웃 및 로그인 화면으로 이동
 */
export function useWithdrawMutation() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: authApi.withdraw,
    onSuccess: async () => {
      // 회원탈퇴 성공 시 로그아웃 처리
      await logout();
      // 로그인 화면으로 이동
      router.replace('/(auth)/login');
    },
  });
}
