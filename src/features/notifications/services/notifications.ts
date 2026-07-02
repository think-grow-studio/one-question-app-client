import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import i18n from '@/locales';

// Expo local notifications foreground presentation.
// Remote FCM foreground presentation on iOS is configured in firebase.json
// because @react-native-firebase/messaging owns the native FCM delegate path.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 서버 FCM 발송 시 android.notification.channel_id에 동일한 값을 사용해야 함
export const NOTIFICATION_CHANNEL_IDS = {
  dailyReminder: 'daily-reminder',
  analysisReport: 'analysis-report',
} as const;

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.dailyReminder, {
    name: '일일 알림',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.analysisReport, {
    name: '분석 리포트',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

/**
 * 알림 권한 요청.
 * - granted: true 반환
 * - canAskAgain: 다이얼로그 노출, 결과 반영
 * - 영구 거부: 시스템 설정으로 유도하는 Alert 표시 후 false 반환
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.status === 'granted') {
    await ensureAndroidNotificationChannel();
    return true;
  }

  if (existing.canAskAgain) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await ensureAndroidNotificationChannel();
      return true;
    }
    return false;
  }

  // OS가 더 이상 프롬프트를 띄우지 않는 상태 → 설정 앱으로 유도
  // 모듈 레벨이라 hook 사용 불가, i18n singleton의 t()를 직접 사용
  Alert.alert(
    i18n.t('notification.permission.title', { ns: 'settings' }),
    i18n.t('notification.permission.message', { ns: 'settings' }),
    [
      { text: i18n.t('notification.permission.cancel', { ns: 'settings' }), style: 'cancel' },
      { text: i18n.t('notification.permission.openSettings', { ns: 'settings' }), onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

/**
 * 알림 권한 상태 확인
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
