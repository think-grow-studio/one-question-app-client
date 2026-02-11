import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { AccentColorPicker } from '@/features/settings/components/AccentColorPicker';
import { NotificationSettings } from '@/features/settings/components/NotificationSettings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { GoogleIcon } from '@/shared/icons/GoogleIcon';
import { AppleIcon } from '@/shared/icons/AppleIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import { useWithdrawMutation } from '@/features/auth/hooks/mutations/useAuthMutations';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const { logout } = useAuthStore();
  const { data: member } = useMemberMe();
  const withdrawMutation = useWithdrawMutation();
  const withdrawDialog = useAlertDialog();

  const isGoogleProvider = member?.provider === 'GOOGLE';
  const isAppleProvider = member?.provider === 'APPLE';
  const providerLabel = isGoogleProvider
    ? t('account.providerGoogle')
    : isAppleProvider
      ? t('account.providerApple')
      : '';

  const handleLogout = async () => {
    await logout();
  };

  const handleWithdrawPress = () => {
    withdrawDialog.show({
      title: t('account.withdrawTitle'),
      message: t('account.withdrawMessage'),
      buttons: [
        {
          label: t('account.withdrawCancel'),
          variant: 'default',
        },
        {
          label: t('account.withdrawConfirm'),
          variant: 'destructive',
          onPress: () => {
            withdrawMutation.mutate();
          },
        },
      ],
    });
  };

  return (
    <Screen>
      <YStack flex={1} bg="$background">
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            alignItems: 'center',
            borderBottomColor: theme.borderColor?.val,
            borderBottomWidth: 1,
          }}
        >
          <Text variant="subheading" fontWeight="600">
            {t('title')}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <YStack px="$4" py="$4" gap="$4">
          {/* Appearance Section */}
          <YStack gap="$2">
            <Text variant="caption" muted px="$1">
              {t('appearance.title')}
            </Text>
            <ThemeToggle />
            <AccentColorPicker />
          </YStack>

          {/* Notification Section */}
          <YStack gap="$2" mt="$4">
            <Text variant="caption" muted px="$1">
              {t('notification.sectionTitle')}
            </Text>
            <NotificationSettings />
          </YStack>

          {/* Account Section */}
          <YStack gap="$2" mt="$4">
            <Text variant="caption" muted px="$1">
              {t('account.title')}
            </Text>
            {member && (
              <YStack
                py="$3"
                px="$4"
                bg="$backgroundSoft"
                borderRadius={12}
                gap="$3"
              >
                {/* Provider Info */}
                <XStack alignItems="center" gap="$2">
                  {isGoogleProvider && <GoogleIcon size={20} />}
                  {isAppleProvider && <AppleIcon size={20} color={theme.color?.val} />}
                  <Text variant="body">{providerLabel}</Text>
                </XStack>
                {/* Email */}
                <View>
                  <Text variant="caption" muted mb="$1">
                    {t('account.email')}
                  </Text>
                  <Text variant="body">{member.email}</Text>
                </View>
              </YStack>
            )}
          </YStack>

          {/* App Info Section */}
          <YStack gap="$2" mt="$4">
            <Text variant="caption" muted px="$1">
              {t('appInfo.title')}
            </Text>
            <YStack
              py="$3"
              px="$4"
              bg="$backgroundSoft"
              borderRadius={12}
              gap="$2"
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="body" muted>
                  {t('appInfo.version')}
                </Text>
                <Text variant="body">1.0.0</Text>
              </View>
            </YStack>
          </YStack>

          {/* Logout Button */}
          <YStack mt="$4">
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  backgroundColor: theme.backgroundSoft?.val,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text variant="body" color="$red10">
                {t('account.logout')}
              </Text>
            </Pressable>
          </YStack>

          {/* Withdraw Button - Small, Bottom Right */}
          <YStack mt="$2" alignItems="flex-end">
            <Pressable
              onPress={handleWithdrawPress}
              style={({ pressed }) => [
                styles.withdrawButton,
                {
                  opacity: pressed ? 0.5 : 1,
                },
              ]}
            >
              <Text variant="caption" color="$gray9" style={styles.withdrawText}>
                {t('account.withdraw')}
              </Text>
            </Pressable>
          </YStack>
        </YStack>
        </ScrollView>

        {/* Withdraw Confirmation Dialog */}
        <AlertDialog
          visible={withdrawDialog.visible}
          title={withdrawDialog.config.title}
          message={withdrawDialog.config.message}
          buttons={withdrawDialog.config.buttons}
          onClose={withdrawDialog.hide}
        />
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  withdrawText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
