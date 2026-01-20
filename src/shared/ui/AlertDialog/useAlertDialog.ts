import { useState, useCallback } from 'react';
import type { AlertDialogButton } from './AlertDialog';

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertDialogButton[];
};

export function useAlertDialog() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({ title: '' });

  const show = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    config,
    show,
    hide,
  };
}
