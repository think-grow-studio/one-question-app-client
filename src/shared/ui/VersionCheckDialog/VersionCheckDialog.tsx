import { useEffect } from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import { AlertDialog, AlertDialogButton } from '@/shared/ui/AlertDialog';
import { APP_STORE_URLS } from '@/constants/appStoreUrls';
import { useTranslation } from 'react-i18next';

type VersionCheckType = 'force_update' | 'optional_update' | 'server_down';

interface VersionCheckDialogProps {
  visible: boolean;
  type: VersionCheckType | null;
  latestVersion: string;
  onClose: () => void;
  onUpdate: () => void;
  onServerDownConfirm: () => void;
}

export function VersionCheckDialog({
  visible,
  type,
  latestVersion,
  onClose,
  onUpdate,
  onServerDownConfirm,
}: VersionCheckDialogProps) {
  const { t } = useTranslation('common');

  // Android back button: force_update exits app
  useEffect(() => {
    if (type !== 'force_update') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, [type]);

  const getDialogConfig = (): {
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertDialogButton[];
    dismissable: boolean;
  } => {
    if (!visible || !type) {
      return {
        visible: false,
        title: '',
        message: '',
        buttons: [],
        dismissable: false,
      };
    }

    switch (type) {
      case 'force_update':
        return {
          visible: true,
          title: t('versionCheck.forceUpdate.title'),
          message: t('versionCheck.forceUpdate.message', { version: latestVersion }),
          buttons: [
            { label: t('versionCheck.updateNow'), variant: 'primary', onPress: onUpdate }
          ],
          dismissable: false,
        };

      case 'optional_update':
        return {
          visible: true,
          title: t('versionCheck.optionalUpdate.title'),
          message: t('versionCheck.optionalUpdate.message', { version: latestVersion }),
          buttons: [
            { label: t('versionCheck.skip'), variant: 'default', onPress: onClose },
            { label: t('versionCheck.updateNow'), variant: 'primary', onPress: onUpdate },
          ],
          dismissable: true,
        };

      case 'server_down':
        return {
          visible: true,
          title: t('versionCheck.serverDown.title'),
          message: t('versionCheck.serverDown.message'),
          buttons: [
            { label: t('buttons.confirm'), variant: 'primary', onPress: onServerDownConfirm }
          ],
          dismissable: false,
        };

      default:
        return {
          visible: false,
          title: '',
          message: '',
          buttons: [],
          dismissable: false,
        };
    }
  };

  const config = getDialogConfig();

  return (
    <AlertDialog
      visible={config.visible}
      title={config.title}
      message={config.message}
      buttons={config.buttons}
      onClose={() => {
        if (config.dismissable && type === 'optional_update') {
          onClose();
        }
      }}
    />
  );
}
