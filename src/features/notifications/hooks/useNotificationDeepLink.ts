import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { onFCMNotificationOpened, getInitialFCMNotification } from '@/services/firebase';

interface UseNotificationDeepLinkParams {
  isAuthenticated: boolean;
  /** 스플래시 종료 여부 — 종료 상태 초기 알림 처리는 앱이 라우팅 가능한 시점 이후에만 */
  isAppReady: boolean;
}

/**
 * 알림 탭 → 화면 이동 (인증된 경우만).
 * - 분석 완료(ANALYSIS_DONE) 푸시면 해당 결과 화면으로 딥링크
 * - 그 외에는 홈으로 이동
 * 세 경로 공용: expo 로컬 알림 탭 / FCM 백그라운드 탭 / FCM 종료 상태 시작
 */
export function useNotificationDeepLink({
  isAuthenticated,
  isAppReady,
}: UseNotificationDeepLinkParams): void {
  const router = useRouter();

  const routeFromNotificationData = useCallback(
    (data: { type?: unknown; analysisId?: unknown } | undefined) => {
      if (!isAuthenticated) return;

      if (data?.type === 'ANALYSIS_DONE' && typeof data.analysisId === 'string' && data.analysisId) {
        router.replace(`/(tabs)/analysis/${data.analysisId}`);
        return;
      }

      router.replace('/(tabs)');
    },
    [router, isAuthenticated]
  );

  useEffect(() => {
    // 포그라운드에서 expo local notification으로 표시된 알림 탭 (Android 브릿지 포함)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        routeFromNotificationData(
          response.notification.request.content.data as
            | { type?: string; analysisId?: string }
            | undefined
        );
      }
    );

    // 백그라운드에서 FCM SDK가 직접 표시한 알림 탭
    const unsubscribeOpened = onFCMNotificationOpened((message) => {
      routeFromNotificationData(message.data);
    });

    return () => {
      subscription.remove();
      unsubscribeOpened();
    };
  }, [routeFromNotificationData]);

  // 종료(quit) 상태에서 알림 탭으로 시작된 경우 — 인증·스플래시 완료 후 1회만 처리
  const initialNotificationHandled = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !isAppReady || initialNotificationHandled.current) return;
    initialNotificationHandled.current = true;

    getInitialFCMNotification().then((message) => {
      if (message) routeFromNotificationData(message.data);
    });
  }, [isAuthenticated, isAppReady, routeFromNotificationData]);
}
