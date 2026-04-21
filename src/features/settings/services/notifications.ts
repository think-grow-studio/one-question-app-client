import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

// 알림 표시 설정 (포그라운드에서도 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: '일일 알림',
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
    await ensureAndroidChannel();
    return true;
  }

  if (existing.canAskAgain) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await ensureAndroidChannel();
      return true;
    }
    return false;
  }

  // OS가 더 이상 프롬프트를 띄우지 않는 상태 → 설정 앱으로 유도
  Alert.alert(
    '알림 권한이 필요해요',
    '알림을 받으려면 설정 앱에서 권한을 허용해 주세요.',
    [
      { text: '취소', style: 'cancel' },
      { text: '설정 열기', onPress: () => Linking.openSettings() },
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
