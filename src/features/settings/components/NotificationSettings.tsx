import { useState } from 'react';
import { Switch, View, Pressable } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { TimePickerSheet } from './TimePickerSheet';

export function NotificationSettings() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const { isEnabled, hour, minute, toggleNotification, updateNotificationTime } =
    useNotificationSettings();

  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? t('notification.pm') : t('notification.am');
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${period} ${displayHour}:${m.toString().padStart(2, '0')}`;
  };

  const handleTimeConfirm = (newHour: number, newMinute: number) => {
    updateNotificationTime(newHour, newMinute);
  };

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
            <Text variant="body" fontWeight="600">
              {t('notification.title')}
            </Text>
            <Text variant="caption" muted style={{ marginTop: 2 }}>
              {t('notification.description')}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggleNotification}
            trackColor={{
              false: theme.borderColor?.val,
              true: theme.primary?.val,
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
              fontWeight="600"
              style={{ color: isEnabled ? theme.color?.val : theme.colorMuted?.val }}
            >
              {t('notification.time')}
            </Text>
            <XStack ai="center" gap="$2">
              <Text
                variant="body"
                fontWeight="600"
                style={{
                  fontSize: 17,
                  color: isEnabled ? theme.primary?.val : theme.colorMuted?.val,
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
    </>
  );
}
