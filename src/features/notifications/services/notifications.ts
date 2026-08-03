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
  // 채널명은 Android 시스템 설정에 노출되는 user-facing 문자열 — i18n 필수.
  // setNotificationChannelAsync는 기존 채널의 name도 갱신하므로 언어 변경이 반영됨.
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.dailyReminder, {
    name: i18n.t('notification.channels.dailyReminder', { ns: 'settings' }),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.analysisReport, {
    name: i18n.t('notification.channels.analysisReport', { ns: 'settings' }),
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
 * 알림 권한 상태.
 * **'undetermined'(아직 요청한 적 없음)와 'denied'(거부/해제됨)를 뭉개면 안 된다.**
 * iOS는 앱이 권한을 한 번이라도 *요청*해야 설정 앱에 알림 항목을 만들어준다
 * (확인만 하는 getPermissionsAsync는 등록하지 않는다). 그래서 undetermined 상태에서
 * "설정에서 켜주세요"로 안내하면 항목이 없는 화면에 도착해 막다른 길이 된다.
 * undetermined의 올바른 처방은 앱 안에서 권한을 요청하는 것(토글을 켜는 것)이다.
 */
export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'undetermined';
  return 'denied';
}

/**
 * "지금 알림이 전달될 수 있나"만 필요한 곳(토큰 게이트, 분석 pre-prompt)용 축약.
 * 전달 관점에선 undetermined와 denied가 동일하므로 뭉개도 된다.
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  return (await getNotificationPermissionState()) === 'granted';
}
