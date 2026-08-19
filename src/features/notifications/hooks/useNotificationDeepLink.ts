import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { onFCMNotificationOpened, getInitialFCMNotification } from '@/services/firebase';
import {
  parseNotificationEvent,
  type NotificationEvent,
} from '@/features/notifications/domain/notificationEvents';

interface UseNotificationDeepLinkParams {
  isAuthenticated: boolean;
  /** 스플래시 종료 여부 — 종료 상태 초기 알림 처리는 앱이 라우팅 가능한 시점 이후에만 */
  isAppReady: boolean;
  /** 알림 탭으로 파싱된 typed event 전달 — 실제 라우팅 결정은 호출측(app integration) 책임 */
  onNotificationOpen: (event: NotificationEvent) => void;
}

/**
 * 알림 탭 → typed event 전달 (인증된 경우만).
 * 세 경로 공용: expo 로컬 알림 탭 / FCM 백그라운드 탭 / FCM 종료 상태 시작
 * 이 훅은 route를 모른다 — event를 어느 화면으로 보낼지는 app integration이 결정한다.
 */
export function useNotificationDeepLink({
  isAuthenticated,
  isAppReady,
  onNotificationOpen,
}: UseNotificationDeepLinkParams): void {
  const onNotificationOpenRef = useRef(onNotificationOpen);
  onNotificationOpenRef.current = onNotificationOpen;

  const handleNotificationData = useCallback(
    (data: Record<string, unknown> | undefined) => {
      if (!isAuthenticated) return;
      onNotificationOpenRef.current(parseNotificationEvent(data));
    },
    [isAuthenticated]
  );

  useEffect(() => {
    // 포그라운드에서 expo local notification으로 표시된 알림 탭 (Android 브릿지 포함)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationData(response.notification.request.content.data);
      }
    );

    // 백그라운드에서 FCM SDK가 직접 표시한 알림 탭
    const unsubscribeOpened = onFCMNotificationOpened((message) => {
      handleNotificationData(message.data);
    });

    return () => {
      subscription.remove();
      unsubscribeOpened();
    };
  }, [handleNotificationData]);

  // 종료(quit) 상태에서 알림 탭으로 시작된 경우 — 인증·스플래시 완료 후 1회만 처리
  const initialNotificationHandled = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !isAppReady || initialNotificationHandled.current) return;
    initialNotificationHandled.current = true;

    getInitialFCMNotification().then((message) => {
      if (message) handleNotificationData(message.data);
    });
  }, [isAuthenticated, isAppReady, handleNotificationData]);
}
