import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';
import { useTranslation } from 'react-i18next';

export function GlobalErrorHandler() {
  const { t } = useTranslation('common');
  const { isVisible, message, requestId, hideError } = useApiErrorStore();
  const pathname = usePathname();
  const isFirstRenderRef = useRef(true);

  // 사용자가 dialog 무시하고 router.back() 시 다음 화면에서 터치 먹통 되는 stuck 방지.
  // 초기 mount는 무시 (mount 시점의 pathname 변화가 showError trigger와 race하지 않도록).
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVisible) hideError();
  }, [pathname]);

  // 메시지에 requestId 추가 (__DEV__ 모드에서만)
  const displayMessage = __DEV__ && requestId
    ? `${message || t('error.unknown', '알 수 없는 오류가 발생했습니다.')}\n\nRequest ID: ${requestId}`
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
