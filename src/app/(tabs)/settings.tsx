import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/layout/Screen';
import { Text } from '@/shared/ui/Text';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { AccentColorPicker } from '@/features/settings/components/AccentColorPicker';
import { NotificationSettings } from '@/features/settings/components/NotificationSettings';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { GoogleIcon } from '@/shared/icons/GoogleIcon';
import { AppleIcon } from '@/shared/icons/AppleIcon';
import { InfoIcon } from '@/shared/icons/InfoIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog/AlertDialog';
import { config } from '@/constants/config';
import { useAlertDialog } from '@/shared/ui/AlertDialog/useAlertDialog';
import { useWithdrawMutation } from '@/features/auth/hooks/mutations/useAuthMutations';
import { LinkGoogleButton } from '@/features/auth/components/LinkGoogleButton';
import { LinkAppleButton } from '@/features/auth/components/LinkAppleButton';
import { logScreenView, logEvent, AnalyticsEvents } from '@/services/firebase';
import { getFontStyle } from '@/shared/theme/typography';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { shouldHideAds } from '@/features/member/constants/permissions';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const { logout } = useAuthStore();
  const { data: member } = useMemberMe();
  const withdrawMutation = useWithdrawMutation();
  const withdrawDialog = useAlertDialog();

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const isAdFreeMember = shouldHideAds(member?.permission);
  const isGoogleProvider = member?.provider === 'GOOGLE';
  const isAppleProvider = member?.provider === 'APPLE';
  const isAnonymousProvider = member?.provider === 'ANONYMOUS';
  const providerLabel = isGoogleProvider
    ? t('account.providerGoogle')
    : isAppleProvider
      ? t('account.providerApple')
      : isAnonymousProvider
        ? t('account.providerAnonymous')
        : '';

  const formattedCycleStartDate = useMemo(() => {
    if (!member?.cycleStartDate) return '';
    const [year, month, day] = member.cycleStartDate.split('-').map(Number);
    const months = t('account.months', { returnObjects: true });
    const monthName = Array.isArray(months) ? months[month - 1] : '';
    return t('account.cycleStartDateFormat', { year, month, day, monthName });
  }, [member?.cycleStartDate, t]);

  // Analytics: 화면 조회
  useEffect(() => {
    logScreenView('Settings');
  }, []);

  const handleLogout = async () => {
    // Analytics: 로그아웃
    await logEvent(AnalyticsEvents.LOGOUT);
    await logout();
  };

  const handleContactDeveloper = () => {
    Linking.openURL(
      'mailto:studiothinkgrow@gmail.com?subject=%5BOne%20Question%5D%20%EB%AC%B8%EC%9D%98'
    );
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
            // Analytics: 회원탈퇴
            logEvent(AnalyticsEvents.ACCOUNT_DELETE);
            withdrawMutation.mutate();
          },
        },
      ],
    });
  };

  return (
    <Screen edges={['top']}>
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
          <Text variant="subheading" {...getFontStyle('600')}>
            {t('title')}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} onTouchStart={() => setTooltipVisible(false)}>
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
            {member && isAnonymousProvider && (
              <YStack
                py="$3"
                px="$4"
                bg="$backgroundSoft"
                borderRadius={12}
                gap="$3"
              >
                {/* Provider Info */}
                <XStack alignItems="center" gap="$2">
                  <Text variant="body">{providerLabel}</Text>
                </XStack>
                {/* Warning */}
                <Text variant="caption" muted>
                  {t('account.linkGoogleWarning')}
                </Text>
                {/* Link Buttons */}
                <YStack gap="$2">
                  <LinkGoogleButton />
                  {Platform.OS === 'ios' && <LinkAppleButton />}
                </YStack>
              </YStack>
            )}
            {member && !isAnonymousProvider && (
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
                {/* Question Start Date */}
                {member.cycleStartDate && (
                  <View>
                    <XStack alignItems="center" gap="$1">
                      <Text variant="caption" muted>
                        {t('account.cycleStartDate')}
                      </Text>
                      <Pressable onPress={() => setTooltipVisible(v => !v)}>
                        <InfoIcon size={14} color={theme.gray9?.val} />
                      </Pressable>
                    </XStack>
                    {tooltipVisible && (
                      <View style={[styles.tooltipBubble, { backgroundColor: theme.backgroundSoft?.val, borderColor: theme.borderColor?.val }]}>
                        <Text variant="caption" fontSize={12}>
                          {t('account.cycleStartDateTooltip')}
                        </Text>
                        <View style={[styles.tooltipArrow, { backgroundColor: theme.backgroundSoft?.val, borderColor: theme.borderColor?.val }]} />
                      </View>
                    )}
                    <Text variant="body" mt="$1">{formattedCycleStartDate}</Text>
                  </View>
                )}
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
                <Text variant="body">{config.appVersion}</Text>
              </View>
            </YStack>
            <Pressable
              onPress={handleContactDeveloper}
              style={({ pressed }) => [
                styles.contactButton,
                {
                  backgroundColor: theme.backgroundSoft?.val,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text variant="body">{t('appInfo.contact')}</Text>
            </Pressable>
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

        {!isAdFreeMember && <BannerAdSlot disableSafeAreaPadding />}

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
  contactButton: {
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
  tooltipBubble: {
    position: 'absolute',
    top: 24,
    left: 0,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 260,
  },
  tooltipArrow: {
    position: 'absolute',
    top: -5,
    left: 16,
    width: 8,
    height: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
});
