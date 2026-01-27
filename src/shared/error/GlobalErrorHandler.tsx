import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { useTranslation } from 'react-i18next';

export function GlobalErrorHandler() {
  const { t } = useTranslation('common');
  const { isVisible, message, hideError } = useApiErrorStore();

  return (
    <AlertDialog
      visible={isVisible}
      title={t('error.title', '오류')}
      message={message || t('error.unknown', '알 수 없는 오류가 발생했습니다.')}
      buttons={[
        { label: t('buttons.confirm', '확인'), variant: 'primary' },
      ]}
      onClose={hideError}
    />
  );
}
