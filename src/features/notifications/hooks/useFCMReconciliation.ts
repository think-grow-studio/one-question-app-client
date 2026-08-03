import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { getFCMToken } from '@/services/firebase';
import { recordError } from '@/services/firebase/crashlytics';
import { memberQueryKeys, useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { useNotificationStore } from '@/features/notifications/stores/useNotificationStore';
import { notificationApi } from '@/features/notifications/api/notificationApi';
import { getNotificationPermissionStatus } from '@/features/notifications/services/notifications';
import { GetMemberResponse } from '@/shared/types/api';

/**
 * 사용자가 받겠다고 한 알림 카테고리 (intent) — 호출 시점의 값을 읽는다.
 * useAnalysisReportEnabled와 같은 규칙의 비-훅 버전: 서버 필드가 있으면 서버 우선,
 * 없으면 로컬 store fallback.
 */
/**
 * 개발 빌드 진단용. 이 훅은 실패해도 조용하고 결과가 서버에만 남아서, 로그 없이는
 * "어느 분기로 갔는지"를 확인할 방법이 없다. 토큰은 앞 8자만 남긴다.
 */
function debugLog(message: string) {
  if (__DEV__) console.log(`[FCM Reconcile] ${message}`);
}

function maskToken(token: string | null): string {
  return token ? `${token.slice(0, 8)}…(len=${token.length})` : 'null';
}

function readIntent(queryClient: QueryClient) {
  const setting = queryClient.getQueryData<GetMemberResponse>(
    memberQueryKeys.me()
  )?.notificationSetting;

  return {
    reminder: setting?.enabled ?? false,
    report:
      setting?.analysisReportEnabled ??
      useNotificationStore.getState().analysisReportEnabled,
  };
}

/**
 * FCM 토큰을 "지금 푸시가 전달 가능한 상태"에 수렴시킨다. 앱 진입·백그라운드 복귀 시 실행.
 *
 * 설계: 사용자 의사(intent)와 기기 능력(capability)을 섞지 않는다.
 * - intent(리마인드/분석 리포트 on/off)는 사용자의 명시적 조작으로만 바뀐다.
 *   **여기서 알림 설정을 PUT하지 않는다** — OS 권한 상태로 설정을 덮어쓰면 권한을
 *   껐다 켠 사용자의 선택이 복구 불가능하게 사라진다.
 * - capability(OS 권한)는 토큰으로 게이팅한다. 권한이 없으면 서버 토큰을 지워
 *   전송 경로 자체를 끊고, 권한이 돌아오면 다시 등록해 설정 그대로 복구된다.
 *
 * 카테고리별 차단은 토큰으로 못 나눈다(토큰 하나를 두 카테고리가 공유) — 그건 서버
 * 발송 필터의 몫이다. 그래서 삭제는 권한 게이트에만 걸고, "둘 다 off"는 토큰을 남긴다
 * (useDisableNotificationMutation의 재활성화 마찰 최소화 정책과 일관).
 *
 * 멱등하며 어떤 상태에서 시작해도 수렴한다. 실패해도 store를 갱신하지 않아 다음 실행이 재시도한다.
 */
export function useFCMReconciliation() {
  const { data: member } = useMemberMe();
  const queryClient = useQueryClient();
  const isReconciling = useRef(false);
  const isMemberLoaded = !!member;

  const reconcile = useCallback(async (trigger: 'mount' | 'foreground') => {
    if (isReconciling.current) {
      debugLog(`${trigger}: 이미 실행 중이라 건너뜀`);
      return;
    }
    isReconciling.current = true;

    try {
      const permissionGranted = await getNotificationPermissionStatus();
      const storedToken = useNotificationStore.getState().fcmToken;
      debugLog(
        `${trigger}: permission=${permissionGranted} storedToken=${maskToken(storedToken)}`
      );

      if (!permissionGranted) {
        // 권한 없음 → 토큰을 떼어 전송 경로를 끊는다. 설정값은 사용자 의사로 보존.
        if (storedToken) {
          debugLog('권한 없음 → 서버 토큰 삭제 요청');
          await notificationApi.deleteFcmToken(storedToken);
          useNotificationStore.getState().setFcmToken(null);
          debugLog('서버 토큰 삭제 완료');
        } else {
          debugLog('권한 없음 + 로컬에 기억된 토큰 없음 → 삭제할 대상이 없음');
        }
        return;
      }

      // 어떤 카테고리도 원하지 않으면 새 토큰을 심지 않는다 (이미 있으면 그대로 둔다).
      const { reminder, report } = readIntent(queryClient);
      if (!reminder && !report) {
        debugLog('두 카테고리 모두 off → 새 토큰을 심지 않음');
        return;
      }

      const sdkToken = await getFCMToken();
      if (!sdkToken) {
        debugLog('SDK 토큰을 받지 못함');
        return;
      }
      if (sdkToken === storedToken) {
        debugLog('SDK 토큰 == 저장된 토큰 → 할 일 없음');
        return;
      }

      debugLog(`토큰 불일치 → 서버 등록 요청 (sdk=${maskToken(sdkToken)})`);
      await notificationApi.registerFcmToken(sdkToken);
      useNotificationStore.getState().setFcmToken(sdkToken);
      debugLog('서버 토큰 등록 완료');
    } catch (e) {
      console.warn('[FCM Reconcile] 실패:', e);
      if (!__DEV__) {
        const err = e instanceof Error ? e : new Error(String(e));
        recordError(err, 'useFCMReconciliation');
      }
    } finally {
      isReconciling.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    // member 로드 전에는 intent를 읽을 수 없어 기본값으로 오판한다.
    if (!isMemberLoaded) {
      debugLog('member 미로드 → 대기');
      return;
    }

    reconcile('mount');

    // 권한은 앱 밖(시스템 설정)에서만 바뀌므로 실제로 백그라운드에 다녀온 경우만 재확인한다.
    // 'inactive'는 인앱 권한 다이얼로그에서도 발생해 토글 흐름과 중복 등록 race를 만든다.
    // iOS는 복귀 시 background→inactive→active로 오기도 해 직전 상태만으로는 판정할 수 없다.
    let wasBackgrounded = false;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        wasBackgrounded = true;
      } else if (nextState === 'active' && wasBackgrounded) {
        wasBackgrounded = false;
        reconcile('foreground');
      }
    });

    return () => subscription.remove();
  }, [isMemberLoaded, reconcile]);
}
