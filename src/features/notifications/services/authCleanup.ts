import { registerAuthCleanup } from '@/shared/stores/useAuthStore';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';

/**
 * 세션 종료 시 FCM 토큰 정리를 auth 흐름에 연결한다. 앱 부트스트랩(_layout)에서 1회 호출.
 * - 로그아웃: 액세스 토큰 만료 전에 서버 토큰 삭제 (실패해도 로그아웃 진행 — 스토어가 흡수)
 * - 로그아웃·탈퇴 공통: 로컬 store 토큰 제거
 */
export function registerNotificationAuthCleanup(): void {
  registerAuthCleanup({
    beforeServerLogout: async () => {
      const { fcmToken } = useNotificationStore.getState();
      if (fcmToken) await notificationApi.deleteFcmToken(fcmToken);
    },
    onLocalCleanup: () => {
      useNotificationStore.getState().setFcmToken(null);
      // 계정별 설정이므로 다음 계정이 이전 계정의 로컬 값을 물려받지 않도록 기본값 복원
      useNotificationStore.getState().setAnalysisReportEnabled(true);
    },
  });
}
