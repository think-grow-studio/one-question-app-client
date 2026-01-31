import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { useTranslation } from 'react-i18next';

export function GlobalErrorHandler() {
  const { t } = useTranslation('common');
  const { isVisible, message, traceId, hideError } = useApiErrorStore();

  // 메시지에 traceId 추가 (__DEV__ 모드에서만)
  const displayMessage = __DEV__ && traceId
    ? `${message || t('error.unknown', '알 수 없는 오류가 발생했습니다.')}\n\nTrace ID: ${traceId}`
    : message || t('error.unknown', '알 수 없는 오류가 발생했습니다.');

  return (
    <AlertDialog
      visible={isVisible}
      title={t('error.title', '오류')}
      message={displayMessage}
      buttons={[
        { label: t('buttons.confirm', '확인'), variant: 'primary' },
      ]}
      onClose={hideError}
    />
  );
}
