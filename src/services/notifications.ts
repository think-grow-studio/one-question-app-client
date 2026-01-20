import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import i18n from '@/locales';

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

const DAILY_NOTIFICATION_ID = 'daily-question-reminder';

/**
 * 실제 기기인지 확인
 */
export function isRealDevice(): boolean {
  return Device.isDevice;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 시뮬레이터에서는 UI 테스트를 위해 true 반환 (실제 알림은 작동 안함)
  if (!Device.isDevice) {
    console.log('시뮬레이터: 알림은 실제 기기에서만 작동합니다.');
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('알림 권한이 거부되었습니다.');
    return false;
  }

  // Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: '일일 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * 알림 권한 상태 확인
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * 매일 반복 알림 스케줄링
 */
export async function scheduleDailyNotification(
  hour: number,
  minute: number
): Promise<string | null> {
  // 시뮬레이터에서는 스케줄링 스킵
  if (!Device.isDevice) {
    console.log(`시뮬레이터: 알림 스케줄링 스킵 (${hour}:${minute.toString().padStart(2, '0')})`);
    return 'simulator-mock-id';
  }

  try {
    // 기존 알림 취소
    await cancelDailyNotification();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('settings:notification.pushTitle'),
        body: i18n.t('settings:notification.pushBody'),
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        second: 0,
      },
    });

    console.log(`알림 스케줄됨: ${hour}:${minute.toString().padStart(2, '0')}`);

    // 디버그: 예약된 알림 확인
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('예약된 알림 목록:', JSON.stringify(scheduled, null, 2));
    return identifier;
  } catch (error) {
    console.error('알림 스케줄링 실패:', error);
    return null;
  }
}

/**
 * 일일 알림 취소
 */
export async function cancelDailyNotification(): Promise<void> {
  // 시뮬레이터에서는 취소 스킵
  if (!Device.isDevice) {
    console.log('시뮬레이터: 알림 취소 스킵');
    return;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log('모든 예약된 알림이 취소되었습니다.');
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }
}

/**
 * 예약된 알림 목록 조회
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * 테스트용 즉시 알림
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('settings:notification.pushTitle'),
      body: i18n.t('settings:notification.pushBody'),
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
    },
    trigger: null, // 즉시 발송
  });
}

/**
 * 테스트용 5초 후 알림 (디버깅용)
 */
export async function sendDelayedTestNotification(): Promise<void> {
  console.log('5초 후 테스트 알림 예약...');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '테스트 알림',
      body: '5초 후 알림이 정상 작동합니다!',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}
