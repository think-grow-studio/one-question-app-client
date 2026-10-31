import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';
import { useTranslation } from 'react-i18next';

export function GlobalErrorHandler() {
  const { t } = useTranslation('common');
  const { isVisible, message, requestId, hideError } = useApiErrorStore();
  const [isFocused, setIsFocused] = useState(false);

  // Screen 내부에서 표시해야 iOS 네이티브 modal 위에도 present할 수 있다.
  // 스택/탭에 남아 있는 비활성 화면은 표시하지 않고, 이탈 시 이전 오류를 정리한다.
  useFocusEffect(useCallback(() => {
    setIsFocused(true);
    return () => {
      setIsFocused(false);
      hideError();
    };
  }, [hideError]));

  // 메시지에 requestId 추가 (__DEV__ 모드에서만)
  const displayMessage = __DEV__ && requestId
    ? `${message || t('error.unknown', '알 수 없는 오류가 발생했습니다.')}\n\nRequest ID: ${requestId}`
    : message || t('error.unknown', '알 수 없는 오류가 발생했습니다.');

  return (
    <AlertDialog
      visible={isFocused && isVisible}
      title={t('error.title', '오류')}
      message={displayMessage}
      buttons={[
        { label: t('buttons.confirm', '확인'), variant: 'primary' },
      ]}
      onClose={hideError}
    />
  );
}
