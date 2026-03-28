import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { sp, radius, SHEET_MAX_WIDTH } from '@/shared/utils/responsive';
import { useLanguageStore, SUPPORTED_LANGUAGES, type Language } from '@/shared/stores/useLanguageStore';
import { useUpdateLocaleMutation } from '@/features/member/hooks/mutations/useMemberMutations';
import { logEvent, AnalyticsEvents } from '@/services/firebase';

export function LanguagePicker() {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('settings');
  const [visible, setVisible] = useState(false);

  const { language, setLanguage } = useLanguageStore();
  const updateLocaleMutation = useUpdateLocaleMutation();

  const currentLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  const handleSelect = (lang: Language) => {
    if (lang === language) {
      setVisible(false);
      return;
    }

    logEvent(AnalyticsEvents.LANGUAGE_CHANGE, { language: lang });
    setLanguage(lang);
    updateLocaleMutation.mutate(lang);
    setVisible(false);
  };

  return (
    <>
      {/* Row */}
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <XStack
          ai="center"
          jc="space-between"
          py="$3"
          px="$4"
          bg="$backgroundSoft"
          borderRadius={12}
        >
          <Text variant="body" {...getFontStyle('600')}>
            {t('language.title')}
          </Text>
          <XStack ai="center" gap="$2">
            <Text variant="body" style={{ color: theme.colorMuted?.val }}>
              {currentLanguage?.nativeLabel}
            </Text>
            <Text variant="body" style={{ color: theme.colorMuted?.val }}>›</Text>
          </XStack>
        </XStack>
      </Pressable>

      {/* Bottom Sheet */}
      {visible && (
        <Modal transparent visible={visible} animationType="none">
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
            <Animated.View entering={FadeIn} style={styles.backdropOverlay} />
          </Pressable>

          <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.sheetContainer, { maxWidth: SHEET_MAX_WIDTH, alignSelf: 'center', width: '100%' }]}
          >
            <YStack
              style={{
                backgroundColor: theme.surface?.val,
                borderTopLeftRadius: radius(24),
                borderTopRightRadius: radius(24),
                paddingBottom: sp(40),
              }}
            >
              {/* Handle */}
              <YStack ai="center" py="$4">
                <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
              </YStack>

              {/* Title */}
              <YStack ai="center" pb="$4">
                <Text variant="subheading" {...getFontStyle('700')}>
                  {t('language.sheetTitle')}
                </Text>
              </YStack>

              {/* Language List */}
              <YStack px="$5" gap="$2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === language;
                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => handleSelect(lang.code)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <XStack
                        ai="center"
                        jc="space-between"
                        py="$4"
                        px="$4"
                        borderRadius={12}
                        style={{
                          backgroundColor: isSelected
                            ? accent.primary + '1A'
                            : theme.backgroundSoft?.val,
                        }}
                      >
                        <Text
                          variant="body"
                          {...getFontStyle(isSelected ? '600' : '400')}
                          style={{ color: isSelected ? accent.primary : theme.color?.val }}
                        >
                          {lang.nativeLabel}
                        </Text>
                        {isSelected && (
                          <Text variant="body" style={{ color: accent.primary }}>
                            ✓
                          </Text>
                        )}
                      </XStack>
                    </Pressable>
                  );
                })}
              </YStack>
            </YStack>
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
