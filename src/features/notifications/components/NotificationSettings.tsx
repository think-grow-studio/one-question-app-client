import { useCallback, useState } from 'react';
import { Switch, View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import {
  useNotificationSettings,
  type NotificationActionFailureReason,
} from '../hooks/useNotificationSettings';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { TimePickerSheet } from './TimePickerSheet';
import { useAccentColors, getFontStyle } from '@/shared/theme';

export function NotificationSettings() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['settings', 'common']);
  const {
    isEnabled,
    displayedIsEnabled,
    hour,
    minute,
    toggleNotification,
    updateNotificationTime,
    isTogglingNotification,
    isToggleInteractionDisabled,
    displayedAnalysisReportEnabled,
    toggleAnalysisReport,
    isTogglingAnalysisReport,
  } =
    useNotificationSettings();
  const { granted: permissionGranted } = useNotificationPermission();

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

  const handleAnalysisReportToggle = useCallback(async () => {
    const result = await toggleAnalysisReport();
    if (!result.success) showFailureDialog(result.reason);
  }, [toggleAnalysisReport, showFailureDialog]);

  const handleTimeConfirm = useCallback(
    async (newHour: number, newMinute: number) => {
      const result = await updateNotificationTime(newHour, newMinute);
      if (!result.success) showFailureDialog(result.reason);
    },
    [updateNotificationTime, showFailureDialog]
  );

  return (
    <>
      {/* OS 권한 꺼짐 배너 — 시스템 설정으로 안내 (null = 확인 전, 미표시) */}
      {permissionGranted === false && (
        <Pressable
          onPress={() => Linking.openSettings()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginBottom: 12 })}
        >
          <XStack
            bg="$backgroundSoft"
            borderRadius={12}
            py="$3"
            px="$4"
            ai="center"
            jc="space-between"
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" {...getFontStyle('600')}>
                {t('notification.permissionOff.title')}
              </Text>
              <Text variant="caption" muted style={{ marginTop: 2 }}>
                {t('notification.permissionOff.message')}
              </Text>
            </View>
            <Text
              variant="bodySmall"
              {...getFontStyle('600')}
              style={{ color: accent.primary }}
            >
              {t('notification.permissionOff.action')}
            </Text>
          </XStack>
        </Pressable>
      )}

      <YStack
        bg="$backgroundSoft"
        borderRadius={12}
        overflow="hidden"
      >
        {/* 하루 질문 리마인드 토글 */}
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
          <XStack ai="center" gap="$2">
            {isTogglingNotification && (
              <ActivityIndicator size="small" color={theme.colorMuted?.val} />
            )}
            <Switch
              value={displayedIsEnabled}
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

      {/* AI 분석 리포트 알림 — 별도 카테고리 카드 (하위 설정 경계를 카드로 구분) */}
      <YStack
        bg="$backgroundSoft"
        borderRadius={12}
        overflow="hidden"
        mt="$3"
      >
        <XStack
          ai="center"
          jc="space-between"
          py="$3"
          px="$4"
        >
          <View style={{ flex: 1 }}>
            <Text variant="body" {...getFontStyle('600')}>
              {t('notification.analysisReport.title')}
            </Text>
            <Text variant="caption" muted style={{ marginTop: 2 }}>
              {t('notification.analysisReport.description')}
            </Text>
          </View>
          <XStack ai="center" gap="$2">
            {isTogglingAnalysisReport && (
              <ActivityIndicator size="small" color={theme.colorMuted?.val} />
            )}
            <Switch
              value={displayedAnalysisReportEnabled}
              onValueChange={handleAnalysisReportToggle}
              disabled={isTogglingAnalysisReport}
              trackColor={{
                false: theme.borderColor?.val,
                true: accent.primary,
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.borderColor?.val}
            />
          </XStack>
        </XStack>
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
