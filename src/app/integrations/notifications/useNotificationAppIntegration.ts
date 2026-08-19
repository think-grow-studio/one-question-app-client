import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFCMLifecycle } from '@/features/notifications/hooks/useFCMLifecycle';
import type { NotificationEvent } from '@/features/notifications/domain/notificationEvents';
import { invalidateAnalysisQueries } from '@/features/analysis/public';

/**
 * notifications가 전달하는 push event를 받아 다른 feature에 필요한 effect를 실행한다.
 * notifications ↔ analysis가 서로를 모르게 하기 위한 workflow 소유자 (app/integrations).
 */
export function useNotificationAppIntegration() {
  const queryClient = useQueryClient();

  const handleNotificationEvent = useCallback(
    (event: NotificationEvent) => {
      if (event.type === 'ANALYSIS_DONE') {
        invalidateAnalysisQueries(queryClient);
      }
    },
    [queryClient]
  );

  useFCMLifecycle({ onEvent: handleNotificationEvent });
}
