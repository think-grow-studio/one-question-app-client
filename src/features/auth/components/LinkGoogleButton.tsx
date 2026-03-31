import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { GoogleIcon } from '@/shared/icons/GoogleIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import {
  useCheckGoogleLinkMutation,
  useLinkToGoogleMutation,
} from '@/features/auth/hooks/mutations/useLinkGoogleMutations';
import { logEvent, AnalyticsEvents } from '@/services/firebase';
import { getFontStyle } from '@/shared/theme/typography';
import { sp, radius } from '@/shared/utils/responsive';

export function LinkGoogleButton() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const alertDialog = useAlertDialog();

  const checkMutation = useCheckGoogleLinkMutation();
  const linkMutation = useLinkToGoogleMutation();

  const isPending = checkMutation.isPending || linkMutation.isPending;

  const handlePress = async () => {
    logEvent(AnalyticsEvents.LINK_GOOGLE_START);

    checkMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.checkResult.exists) {
          logEvent(AnalyticsEvents.LINK_GOOGLE_FAIL, { reason: 'conflict' });
          alertDialog.show({
            title: t('account.linkGoogleConflict'),
            buttons: [{ label: 'OK', variant: 'default' }],
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
              alertDialog.show({
                title: t('account.linkGoogleSuccess'),
                buttons: [{ label: 'OK', variant: 'default' }],
              });
            },
            onError: () => {
              logEvent(AnalyticsEvents.LINK_GOOGLE_FAIL, { reason: 'link_error' });
            },
          },
        );
      },
      onError: () => {
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
