import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { AppleIcon } from '@/shared/icons/AppleIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import {
  useCheckAppleLinkMutation,
  useLinkToAppleMutation,
  AppleSignInCancelledError,
} from '@/features/auth/hooks/mutations/useLinkAppleMutations';
import { logEvent, AnalyticsEvents } from '@/services/firebase';
import { getFontStyle } from '@/shared/theme/typography';
import { sp, radius } from '@/shared/utils/responsive';

export function LinkAppleButton() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const alertDialog = useAlertDialog();

  const checkMutation = useCheckAppleLinkMutation();
  const linkMutation = useLinkToAppleMutation();

  const isPending = checkMutation.isPending || linkMutation.isPending;

  const handlePress = async () => {
    logEvent(AnalyticsEvents.LINK_APPLE_START);

    checkMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.checkResult.exists) {
          logEvent(AnalyticsEvents.LINK_APPLE_FAIL, { reason: 'conflict' });
          alertDialog.show({
            title: t('account.linkAppleConflict'),
            message: t('account.linkAppleConflictMessage'),
            buttons: [{ label: t('account.linkAppleConfirm'), variant: 'primary' }],
          });
          return;
        }

        linkMutation.mutate(
          {
            identityToken: result.identityToken,
            name: result.name,
            authorizationCode: result.authorizationCode,
            rawNonce: result.rawNonce,
          },
          {
            onSuccess: () => {
              logEvent(AnalyticsEvents.LINK_APPLE_SUCCESS);
              alertDialog.show({
                title: t('account.linkAppleSuccess'),
                message: t('account.linkAppleSuccessMessage'),
                buttons: [{ label: t('account.linkAppleConfirm'), variant: 'primary' }],
              });
            },
            onError: () => {
              logEvent(AnalyticsEvents.LINK_APPLE_FAIL, { reason: 'link_error' });
            },
          },
        );
      },
      onError: (err) => {
        // 사용자가 native sheet에서 [취소]를 누른 케이스는 정상 흐름이므로 analytics 스킵
        if (err instanceof AppleSignInCancelledError) return;
        logEvent(AnalyticsEvents.LINK_APPLE_FAIL, { reason: 'check_error' });
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
              <AppleIcon size={18} color={theme.color?.val} />
              <Text variant="body" {...getFontStyle('600')}>
                {t('account.linkAppleButton')}
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
        onClose={alertDialog.hide}
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
