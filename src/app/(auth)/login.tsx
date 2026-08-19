import { useEffect } from 'react';
import { StyleSheet, Platform, Image, View } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { useGoogleLogin } from '@/features/auth/hooks/useGoogleLogin';
import { useAppleLogin } from '@/features/auth/hooks/useAppleLogin';
import { useAnonymousLogin } from '@/features/auth/hooks/useAnonymousLogin';
import { AppleIcon } from '@/shared/icons/AppleIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import { Pressable, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getFontStyle } from '@/shared/theme/typography';
import { sp, cs, radius, fs } from '@/shared/utils/responsive';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import * as WebBrowser from 'expo-web-browser';
import { logScreenView } from '@/platform/firebase';

const logoLight = require('@/assets/images/one-question-light.png');
const logoDark = require('@/assets/images/one-question-dark.png');

function GuestIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const { mode } = useThemeStore();
  const { mutate: googleLogin, isPending } = useGoogleLogin();
  const { mutate: appleLogin, isPending: isApplePending } = useAppleLogin();
  const { mutate: anonymousLogin, isPending: isAnonymousPending } = useAnonymousLogin();
  const guestDialog = useAlertDialog();
  const isDark = mode === 'dark';
  const isAnyPending = isPending || isApplePending || isAnonymousPending;

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Login');
  }, []);

  const handleGoogleLogin = () => {
    googleLogin();
  };

  const handleAppleLogin = () => {
    appleLogin();
  };

  const handleGuestLogin = () => {
    guestDialog.show({
      title: t('guestDialogTitle'),
      message: t('guestDialogMessage'),
      buttons: [
        {
          label: t('guestDialogCancel'),
          variant: 'default',
        },
        {
          label: t('guestDialogConfirm'),
          variant: 'primary',
          onPress: () => {
            anonymousLogin();
          },
        },
      ],
    });
  };

  const handlePressTerms = async () => {
    await WebBrowser.openBrowserAsync('https://one-question.org/legal-document');
  };

  return (
    <Screen>
      <YStack flex={1} bg="$background" jc="center" ai="center" px="$6">
        {/* Logo / App Title */}
        <YStack ai="center" gap="$4" mb="$10">
          <Image
            source={isDark ? logoDark : logoLight}
            style={styles.logoImage}
          />
          <YStack ai="center" gap="$2">
            <Text variant="heading" center>
              {t('appTitle')}
            </Text>
            <Text variant="body" muted center>
              {t('appSubtitle')}
            </Text>
          </YStack>
        </YStack>

        {/* Login Buttons */}
        <YStack w="100%" maxWidth={cs(320)} gap="$3">
          {/* Google Login Button */}
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isAnyPending}
            style={({ pressed }) => [
              styles.loginButton,
              {
                backgroundColor: theme.backgroundSoft?.val,
                borderColor: theme.borderColor?.val,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <XStack ai="center" jc="center" gap="$3">
              {isPending ? (
                <ActivityIndicator size="small" color={theme.color?.val} />
              ) : (
                <>
                  <GoogleIcon />
                  <Text variant="body" {...getFontStyle('600')}>
                    {t('loginWithGoogle')}
                  </Text>
                </>
              )}
            </XStack>
          </Pressable>

          {/* Apple Login Button - iOS only */}
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={handleAppleLogin}
              disabled={isAnyPending}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: theme.backgroundSoft?.val,
                  borderColor: theme.borderColor?.val,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <XStack ai="center" jc="center" gap="$3">
                {isApplePending ? (
                  <ActivityIndicator size="small" color={theme.color?.val} />
                ) : (
                  <>
                    <AppleIcon size={20} color={theme.color?.val || '#000000'} />
                    <Text variant="body" {...getFontStyle('600')}>
                      {t('loginWithApple')}
                    </Text>
                  </>
                )}
              </XStack>
            </Pressable>
          )}

          {/* Guest Login Button */}
          <Pressable
            onPress={handleGuestLogin}
            disabled={isAnyPending}
            style={({ pressed }) => [
              styles.guestButton,
              { opacity: pressed ? 0.6 : 1 },
              isAnyPending && styles.disabledButton,
            ]}
          >
            <XStack ai="center" jc="center" gap="$1.5">
              {isAnonymousPending ? (
                <ActivityIndicator size="small" color={theme.color?.val} />
              ) : (
                <>
                  <GuestIcon color={theme.color?.val || '#999'} />
                  <Text variant="body" muted {...getFontStyle('500')}>
                    {t('guestLogin')}
                  </Text>
                </>
              )}
            </XStack>
          </Pressable>
        </YStack>

        {/* Terms */}
        <YStack mt="$8" px="$4">
          <XStack flexWrap="wrap" jc="center" ai="center">
            <Text variant="caption" muted style={styles.termsText}>
              {t('termsAgreementPrefix')}
            </Text>
            <Pressable onPress={handlePressTerms}>
              <Text
                variant="caption"
                style={[
                  styles.termsLink,
                  { color: theme.blue10?.val || '#0066CC' },
                ]}
              >
                {t('termsAgreementLink')}
              </Text>
            </Pressable>
            <Text variant="caption" muted style={styles.termsText}>
              {t('termsAgreementSuffix')}
            </Text>
          </XStack>
        </YStack>
      </YStack>

      {/* Guest Login Confirmation Dialog */}
      <AlertDialog
        visible={guestDialog.visible}
        title={guestDialog.config.title}
        message={guestDialog.config.message}
        buttons={guestDialog.config.buttons}
        onClose={guestDialog.hide}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoImage: {
    width: cs(80),
    height: cs(80),
    borderRadius: radius(20),
  },
  loginButton: {
    paddingVertical: sp(14),
    paddingHorizontal: sp(24),
    borderRadius: radius(12),
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  guestButton: {
    paddingVertical: sp(10),
    paddingHorizontal: sp(24),
  },
  termsText: {
    fontSize: fs(12),
    lineHeight: fs(18),
  },
  termsLink: {
    fontSize: fs(12),
    lineHeight: fs(18),
    textDecorationLine: 'underline',
    ...getFontStyle('500'),
  },
});
