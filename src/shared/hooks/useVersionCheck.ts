import { useEffect, useState } from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appVersionService } from '@/platform/app/appVersion';
import { meetsMinVersion, hasNewerVersion } from '@/shared/utils/versionComparator';
import { formatLocalDate } from '@/shared/utils/date';
import { config } from '@/constants/config';
import { APP_STORE_URLS } from '@/constants/appStoreUrls';

export type VersionCheckType = 'force_update' | 'optional_update' | 'server_down';

export interface VersionCheckDialogState {
  visible: boolean;
  type: VersionCheckType | null;
  latestVersion: string;
}

const VERSION_CHECK_STORAGE_KEY = 'app_version_last_check_date';

const getTodayDateString = (): string => formatLocalDate();

// Check if version check was already done today
async function wasCheckedToday(): Promise<boolean> {
  try {
    const lastCheckDate = await AsyncStorage.getItem(VERSION_CHECK_STORAGE_KEY);
    if (!lastCheckDate) return false;

    const today = getTodayDateString();
    return lastCheckDate === today;
  } catch (error) {
    console.warn('[Version Check] Failed to read last check date:', error);
    return false;
  }
}

// Save today's date as last check date
async function saveCheckDate(): Promise<void> {
  try {
    const today = getTodayDateString();
    await AsyncStorage.setItem(VERSION_CHECK_STORAGE_KEY, today);
    console.log('[Version Check] Saved check date:', today);
  } catch (error) {
    console.warn('[Version Check] Failed to save check date:', error);
  }
}

/**
 * 앱 시작 시 버전 체크 정책 실행 + VersionCheckDialog 상태/핸들러 제공.
 * 우선순위: 서버 다운 > 강제 업데이트 > 선택 업데이트(하루 1회만 노출).
 * 서버 다운/강제 업데이트는 체크 날짜를 저장하지 않아 다음 실행 때 재검사한다.
 */
export function useVersionCheck() {
  const [dialogState, setDialogState] = useState<VersionCheckDialogState>({
    visible: false,
    type: null,
    latestVersion: '',
  });

  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        // 1. Check if already checked today
        const checkedToday = await wasCheckedToday();
        if (checkedToday) {
          console.log('[Version Check] Already checked today, skipping');
          return;
        }

        // 2. Perform version check
        const result = await appVersionService.checkVersion();

        console.log('[Version Check]', {
          currentVersion: config.appVersion,
          serverResponse: result,
          meetsMin: meetsMinVersion(config.appVersion, result.minVersion),
          hasNewer: hasNewerVersion(config.appVersion, result.latestVersion),
        });

        // 3. Determine dialog type (priority order)

        // Priority 1: Server down
        if (!result.serverLive) {
          console.log('[Version Check] -> server_down');
          setDialogState({
            visible: true,
            type: 'server_down',
            latestVersion: result.latestVersion,
          });
          return;
        }

        // Priority 2: Force update
        if (!meetsMinVersion(config.appVersion, result.minVersion)) {
          console.log('[Version Check] -> force_update');
          setDialogState({
            visible: true,
            type: 'force_update',
            latestVersion: result.latestVersion,
          });
          return;
        }

        // Priority 3: Optional update
        if (hasNewerVersion(config.appVersion, result.latestVersion)) {
          console.log('[Version Check] -> optional_update');
          setDialogState({
            visible: true,
            type: 'optional_update',
            latestVersion: result.latestVersion,
          });
          // Save check date - won't show again today
          await saveCheckDate();
          return;
        }

        console.log('[Version Check] -> no update needed');
      } catch (error) {
        console.warn('[Version Check] Failed:', error);
      }
    };

    checkAppVersion();
  }, []);

  const handleDialogClose = () => {
    if (dialogState.type === 'optional_update') {
      setDialogState({ visible: false, type: null, latestVersion: '' });
    }
  };

  const handleUpdate = () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URLS.ios : APP_STORE_URLS.android;
    Linking.openURL(storeUrl);

    if (dialogState.type === 'optional_update') {
      setDialogState({ visible: false, type: null, latestVersion: '' });
    }
  };

  const handleServerDownConfirm = () => {
    BackHandler.exitApp();
  };

  return { dialogState, handleDialogClose, handleUpdate, handleServerDownConfirm };
}
