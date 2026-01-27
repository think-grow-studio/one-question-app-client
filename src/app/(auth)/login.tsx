import { View, StyleSheet, Platform } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { useGoogleLogin } from '@/features/auth/hooks/useGoogleLogin';
import { Pressable, ActivityIndicator } from 'react-native';
import { useThemeStore, getAccentColors } from '@/stores/useThemeStore';
import Svg, { Path } from 'react-native-svg';

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
  const { mode, accentColor } = useThemeStore();
  const colors = getAccentColors(mode, accentColor);
  const { mutate: googleLogin, isPending } = useGoogleLogin();

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <Screen>
      <YStack flex={1} bg="$background" jc="center" ai="center" px="$6">
        {/* Logo / App Title */}
        <YStack ai="center" gap="$4" mb="$10">
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[styles.logoText, { color: colors.textOnPrimary }]}
            >
              ?
            </Text>
          </View>
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
        <YStack w="100%" maxWidth={320} gap="$3">
          {/* Google Login Button */}
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isPending}
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
                  <Text variant="body" fontWeight="600">
                    {t('loginWithGoogle')}
                  </Text>
                </>
              )}
            </XStack>
          </Pressable>

          {/* Apple Login Button - iOS only, for future */}
          {Platform.OS === 'ios' && (
            <Pressable
              disabled
              style={[
                styles.loginButton,
                styles.disabledButton,
                {
                  backgroundColor: theme.backgroundSoft?.val,
                  borderColor: theme.borderColor?.val,
                },
              ]}
            >
              <XStack ai="center" jc="center" gap="$3">
                <Text variant="body" muted>
                  {t('loginWithApple')}
                </Text>
                <Text variant="caption" muted>
                  ({t('comingSoon')})
                </Text>
              </XStack>
            </Pressable>
          )}
        </YStack>

        {/* Terms */}
        <YStack mt="$8" px="$4">
          <Text variant="caption" muted center>
            {t('termsAgreement')}
          </Text>
        </YStack>
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
