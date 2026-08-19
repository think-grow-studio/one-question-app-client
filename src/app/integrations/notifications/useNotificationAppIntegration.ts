import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFCMLifecycle } from '@/features/notifications/hooks/useFCMLifecycle';
import { useNotificationDeepLink } from '@/features/notifications/hooks/useNotificationDeepLink';
import type { NotificationEvent } from '@/features/notifications/domain/notificationEvents';
import { invalidateAnalysisQueries } from '@/features/analysis/public';

interface UseNotificationAppIntegrationParams {
  isAuthenticated: boolean;
  /** 스플래시 종료 여부 — 종료 상태 알림 딥링크 처리는 라우팅 가능한 시점 이후에만 */
  isAppReady: boolean;
}

/**
 * notifications가 전달하는 push event를 받아 다른 feature/route에 필요한 effect를 실행한다.
 * notifications ↔ analysis가 서로를 모르게 하고, notifications가 route 문자열을 모르게 하기 위한
 * workflow 소유자 (app/integrations).
 */
export function useNotificationAppIntegration({
  isAuthenticated,
  isAppReady,
}: UseNotificationAppIntegrationParams) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handlePushEvent = useCallback(
    (event: NotificationEvent) => {
      if (event.type === 'ANALYSIS_DONE') {
        invalidateAnalysisQueries(queryClient);
      }
    },
    [queryClient]
  );

  const handleNotificationOpen = useCallback(
    (event: NotificationEvent) => {
      if (event.type === 'ANALYSIS_DONE' && event.analysisId) {
        router.replace(`/(tabs)/analysis/${event.analysisId}`);
        return;
      }
      router.replace('/(tabs)');
    },
    [router]
  );

  useFCMLifecycle({ onEvent: handlePushEvent });
  useNotificationDeepLink({
    isAuthenticated,
    isAppReady,
    onNotificationOpen: handleNotificationOpen,
  });
}
