import { useRef } from 'react';
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/shared/ui/Text';
import { GoogleIcon } from '@/shared/icons/GoogleIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import {
  useCheckGoogleLinkMutation,
  useLinkToGoogleMutation,
  GoogleSignInCancelledError,
} from '@/features/auth/hooks/mutations/useLinkGoogleMutations';
import { invalidateMemberMe } from '@/features/member/public';
import { logEvent, AnalyticsEvents } from '@/platform/firebase';
import { getFontStyle } from '@/shared/theme/typography';
import { sp, radius } from '@/shared/utils/responsive';

export function LinkGoogleButton() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const alertDialog = useAlertDialog();
  const queryClient = useQueryClient();

  const checkMutation = useCheckGoogleLinkMutation();
  const linkMutation = useLinkToGoogleMutation();

  const isPending = checkMutation.isPending || linkMutation.isPending;
  // success dialog 닫힘 시점에 member 캐시 invalidate를 트리거하기 위한 신호.
  // mutation onSuccess에서 즉시 invalidate하면 LinkGoogleButton이 unmount되며 dialog가
  // 함께 사라지기 때문(상세는 useLinkToGoogleMutation 주석 참고).
  const pendingInvalidateRef = useRef(false);

  // AlertDialog의 모든 닫힘 경로(button onPress / backdrop tap)는 onClose로 통합됨.
  // 이 한 곳에서 보류된 invalidate를 트리거.
  const handleDialogClose = () => {
    alertDialog.hide();
    if (pendingInvalidateRef.current) {
      pendingInvalidateRef.current = false;
      invalidateMemberMe(queryClient);
    }
  };

  const handlePress = async () => {
    logEvent(AnalyticsEvents.LINK_GOOGLE_START);

    checkMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.checkResult.exists) {
          logEvent(AnalyticsEvents.LINK_GOOGLE_FAIL, { reason: 'conflict' });
          // conflict는 provider가 변경되지 않으므로 invalidate 불필요
          alertDialog.show({
            title: t('account.linkGoogleConflict'),
            message: t('account.linkGoogleConflictMessage'),
            buttons: [{ label: t('account.linkGoogleConfirm'), variant: 'primary' }],
          });
          return;
        }

        linkMutation.mutate(
          {
            idToken: result.idToken,
            email: result.email,
            name: result.name,
          },
          {
            onSuccess: () => {
              logEvent(AnalyticsEvents.LINK_GOOGLE_SUCCESS);
              // 사용자가 안내를 본 뒤 dialog를 닫을 때 member 캐시 invalidate
              pendingInvalidateRef.current = true;
              alertDialog.show({
                title: t('account.linkGoogleSuccess'),
                message: t('account.linkGoogleSuccessMessage'),
                buttons: [{ label: t('account.linkGoogleConfirm'), variant: 'primary' }],
              });
            },
            onError: () => {
              logEvent(AnalyticsEvents.LINK_GOOGLE_FAIL, { reason: 'link_error' });
            },
          },
        );
      },
      onError: (err) => {
        // 사용자가 native sheet에서 [취소]를 누른 케이스는 정상 흐름이므로 analytics 스킵
        if (err instanceof GoogleSignInCancelledError) return;
        logEvent(AnalyticsEvents.LINK_GOOGLE_FAIL, { reason: 'check_error' });
      },
    });
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={isPending}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.backgroundSoft?.val,
            borderColor: theme.borderColor?.val,
            opacity: pressed ? 0.7 : isPending ? 0.5 : 1,
          },
        ]}
      >
        <XStack ai="center" jc="center" gap="$2">
          {isPending ? (
            <ActivityIndicator size="small" color={theme.color?.val} />
          ) : (
            <>
              <GoogleIcon size={18} />
              <Text variant="body" {...getFontStyle('600')}>
                {t('account.linkGoogleButton')}
              </Text>
            </>
          )}
        </XStack>
      </Pressable>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.config.title}
        message={alertDialog.config.message}
        buttons={alertDialog.config.buttons}
        onClose={handleDialogClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: sp(12),
    paddingHorizontal: sp(16),
    borderRadius: radius(12),
    borderWidth: 1,
  },
});
