import { NativeModules, Platform } from 'react-native';

const { NotificationPreferences } = NativeModules;

/**
 * 네이티브 SharedPreferences에 알림 설정 저장
 * Boot Receiver가 이 데이터를 읽어서 재부팅 후 알림을 재스케줄합니다.
 */
export async function saveNotificationSettingsNative(
  isEnabled: boolean,
  hour: number,
  minute: number,
  title?: string,
  body?: string
): Promise<void> {
  // Android에서만 동작
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (NotificationPreferences) {
      await NotificationPreferences.saveNotificationSettings(
        isEnabled,
        hour,
        minute,
        title || 'One Question',
        body || '오늘의 질문에 답을 해보세요.'
      );
      console.log('네이티브 SharedPreferences에 알림 설정 저장됨');
    } else {
      console.warn('NotificationPreferences 네이티브 모듈을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('네이티브 알림 설정 저장 실패:', error);
  }
}

/**
 * 네이티브 SharedPreferences에서 알림 설정 읽기
 */
export async function getNotificationSettingsNative(): Promise<{
  isEnabled: boolean;
  hour: number;
  minute: number;
} | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    if (NotificationPreferences) {
      const jsonString = await NotificationPreferences.getNotificationSettings();
      if (jsonString) {
        const data = JSON.parse(jsonString);
        return data.state || null;
      }
    }
    return null;
  } catch (error) {
    console.error('네이티브 알림 설정 읽기 실패:', error);
    return null;
  }
}
