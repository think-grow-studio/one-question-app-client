import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlertDialog } from '@/shared/ui/AlertDialog';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '@/features/notifications/services/notifications';
import { ensurePushTokenRegistered } from '@/features/notifications/services/pushToken';
import { useAnalysisReportEnabled } from '@/features/notifications/hooks/useNotificationSettings';

/**
 * 분석 요청 제출 전 푸시 준비 플로우 (권한 pre-prompt 포함).
 * - 리포트 알림을 설정에서 명시적으로 꺼둔 유저 → 묻지 않고 바로 진행
 * - 권한 있음 → 토큰 등록은 백그라운드로, 바로 진행
 * - 권한 없음 → "완료되면 알려드릴까요?" 다이얼로그 후 진행
 * 알림은 보조 채널이므로 어떤 선택/실패에서도 proceed()는 반드시 호출된다.
 * 호출측은 dialogProps를 <AlertDialog>에 스프레드해 렌더링해야 한다.
 */
export function useAnalysisPushPrompt() {
  const { t } = useTranslation('analysis');
  const dialog = useAlertDialog();
  const analysisReportEnabled = useAnalysisReportEnabled();

  const runWithPushPrompt = useCallback(
    async (proceed: () => void) => {
      if (!analysisReportEnabled) {
        proceed();
        return;
      }

      const granted = await getNotificationPermissionStatus();
      if (granted) {
        void ensurePushTokenRegistered();
        proceed();
        return;
      }

      dialog.show({
        title: t('push.title'),
        message: t('push.message'),
        buttons: [
          { label: t('push.decline'), variant: 'default', onPress: proceed },
          {
            label: t('push.accept'),
            variant: 'primary',
            onPress: async () => {
              const ok = await requestNotificationPermission();
              if (ok) await ensurePushTokenRegistered();
              proceed();
            },
          },
        ],
      });
    },
    [analysisReportEnabled, dialog, t]
  );

  return {
    runWithPushPrompt,
    dialogProps: {
      visible: dialog.visible,
      title: dialog.config.title,
      message: dialog.config.message,
      buttons: dialog.config.buttons,
      onClose: dialog.hide,
      dismissible: false,
    },
  };
}
