import { useCallback, useState } from 'react';
import { Switch, View, Pressable } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import {
  useNotificationSettings,
  type NotificationActionFailureReason,
} from '../hooks/useNotificationSettings';
import { TimePickerSheet } from './TimePickerSheet';
import { useAccentColors, getFontStyle } from '@/shared/theme';

export function NotificationSettings() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['settings', 'common']);
  const {
    isEnabled,
    hour,
    minute,
    toggleNotification,
    updateNotificationTime,
    isToggleInteractionDisabled,
  } =
    useNotificationSettings();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const alertDialog = useAlertDialog();

  // 실패 reason → dialog 매핑.
  // 'permission'은 services/notifications의 Alert이 이미 안내하므로 component에서 추가 표시 안 함.
  const showFailureDialog = useCallback(
    (reason: NotificationActionFailureReason) => {
      if (reason === 'permission') return;
      const titleKey =
        reason === 'network'
          ? 'notification.error.networkFailed.title'
          : 'notification.error.tokenFailed.title';
      const messageKey =
        reason === 'network'
          ? 'notification.error.networkFailed.message'
          : 'notification.error.tokenFailed.message';
      alertDialog.show({
        title: t(`settings:${titleKey}`),
        message: t(`settings:${messageKey}`),
        buttons: [{ label: t('common:buttons.confirm'), variant: 'primary' }],
      });
    },
    [alertDialog, t]
  );

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? t('settings:notification.pm') : t('settings:notification.am');
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${period} ${displayHour}:${m.toString().padStart(2, '0')}`;
  };

  const handleToggle = useCallback(async () => {
    const result = await toggleNotification();
    if (!result.success) showFailureDialog(result.reason);
  }, [toggleNotification, showFailureDialog]);

  const handleTimeConfirm = useCallback(
    async (newHour: number, newMinute: number) => {
      const result = await updateNotificationTime(newHour, newMinute);
      if (!result.success) showFailureDialog(result.reason);
    },
    [updateNotificationTime, showFailureDialog]
  );

  return (
    <>
      <YStack
        bg="$backgroundSoft"
        borderRadius={12}
        overflow="hidden"
      >
        {/* 알림 활성화 토글 */}
        <XStack
          ai="center"
          jc="space-between"
          py="$3"
          px="$4"
        >
          <View style={{ flex: 1 }}>
            <Text variant="body" {...getFontStyle('600')}>
              {t('notification.title')}
            </Text>
            <Text variant="caption" muted style={{ marginTop: 2 }}>
              {t('notification.description')}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={isToggleInteractionDisabled}
            trackColor={{
              false: theme.borderColor?.val,
              true: accent.primary,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.borderColor?.val}
          />
        </XStack>

        {/* 알림 시간 설정 - 비활성화 시 회색 처리 */}
        <View
          style={{
            height: 1,
            backgroundColor: theme.borderColor?.val,
            marginHorizontal: 16,
          }}
        />
        <Pressable
          onPress={() => isEnabled && setShowTimePicker(true)}
          disabled={!isEnabled}
          style={({ pressed }) => ({
            opacity: !isEnabled ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          <XStack
            ai="center"
            jc="space-between"
            py="$3"
            px="$4"
          >
            <Text
              variant="body"
              {...getFontStyle('600')}
              style={{ color: isEnabled ? theme.color?.val : theme.colorMuted?.val }}
            >
              {t('notification.time')}
            </Text>
            <XStack ai="center" gap="$2">
              <Text
                variant="body"
                {...getFontStyle('600')}
                style={{
                  fontSize: 17,
                  color: isEnabled ? accent.primary : theme.colorMuted?.val,
                }}
              >
                {formatTime(hour, minute)}
              </Text>
              <Text
                variant="body"
                style={{ color: theme.colorMuted?.val }}
              >
                ›
              </Text>
            </XStack>
          </XStack>
        </Pressable>
      </YStack>

      {/* Custom Time Picker Sheet */}
      <TimePickerSheet
        visible={showTimePicker}
        hour={hour}
        minute={minute}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
      />

      {/* 토큰/네트워크 실패 안내 dialog */}
      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.config.title}
        message={alertDialog.config.message}
        buttons={alertDialog.config.buttons}
        onClose={alertDialog.hide}
      />
    </>
  );
}
