import { useCallback, useState } from 'react';
import { View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { AlertDialog, useAlertDialog } from '@/shared/ui/AlertDialog';
import { AppSwitch } from '@/shared/ui/AppSwitch';
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
  const { state: permissionState } = useNotificationPermission();
  // 'denied'일 때만 일시정지로 표시한다. 설정값 자체는 끄지 않는다 — 기기 상태로
  // 사용자 의사를 덮어쓰면 권한을 껐다 켠 뒤 복구할 방법이 없다
  // (근거: useFCMReconciliation 주석). 전송은 토큰 삭제로 이미 끊겨 있다.
  //
  // 'undetermined'(아직 요청 전)를 여기 포함시키면 안 된다 — 설정 앱에 알림 항목이
  // 아직 없어서 "설정에서 켜주세요" 안내가 막다른 길이 된다. 그 상태의 올바른 경로는
  // 토글을 눌러 앱 안에서 권한을 요청하는 것이라 카드를 정상으로 두어야 한다.
  const isPaused = permissionState === 'denied';

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
      {/* OS 권한 꺼짐 배너 — 시스템 설정으로 안내 (null = 확인 전, 미표시).
          "왜 안 오는지"는 배너가, "설정은 살아 있다"는 아래 '잠시 멈춤' 라벨이 맡는다. */}
      {isPaused && (
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

      {/* 일시정지 중에는 카드 어디를 눌러도 시스템 설정으로 — 비활성 컨트롤을 눌렀을 때
          "고장난 것 같다"는 인상 대신 갈 곳을 준다. 배너와 같은 목적지라 학습 비용이 없다. */}
      <Pressable
        onPress={() => Linking.openSettings()}
        disabled={!isPaused}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {/* 상태 라벨은 흐리게 처리하는 영역 밖에 둔다 — 흐려진 이유를 설명하는 문구가
            같이 흐려지면 안 된다. 스타일은 설정 화면의 섹션 라벨과 맞춘다. */}
        {isPaused && (
          <Text
            variant="caption"
            muted
            px="$1"
            {...getFontStyle('600')}
            style={{ marginBottom: 8 }}
          >
            {t('notification.permissionOff.paused')}
          </Text>
        )}

        <View
          pointerEvents={isPaused ? 'none' : 'auto'}
          style={{ opacity: isPaused ? 0.4 : 1 }}
        >
          {/* 오늘의 질문 — 토글 + 알림 시간이 한 묶음이라 자체 카드를 갖는다 */}
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
                <AppSwitch
                  value={displayedIsEnabled}
                  onValueChange={handleToggle}
                  disabled={isToggleInteractionDisabled}
                />
              </XStack>
            </XStack>

            {/* 알림 시간 — "오늘의 질문"에 딸린 설정이라 구분선 없이 붙인다.
                구분선은 형제 항목 사이에만 둬서 묶음이 읽히게 한다. */}
            <Pressable
              onPress={() => isEnabled && setShowTimePicker(true)}
              disabled={!isEnabled}
              style={({ pressed }) => ({
                // 일시정지 중에는 바깥 래퍼가 이미 흐리게 하므로 여기서 또 곱하지 않는다
                // (opacity는 중첩되면 곱해져 0.4 × 0.4 = 0.16, 사실상 안 보인다).
                opacity: isPaused ? 1 : !isEnabled ? 0.4 : pressed ? 0.7 : 1,
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

          {/* 분석 리포트 — 별도 카드로 띄운다. "오늘의 질문"은 토글+시간 2행 묶음이라
              한 카드에 합치면 어디까지가 한 설정인지 경계가 흐려진다.
              마스터 토글은 두지 않는다 (전체 끄기는 OS 설정이 담당, 권한 배너가 안내). */}
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
                <AppSwitch
                  value={displayedAnalysisReportEnabled}
                  onValueChange={handleAnalysisReportToggle}
                  disabled={isTogglingAnalysisReport}
                />
              </XStack>
            </XStack>
          </YStack>
        </View>
      </Pressable>

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
