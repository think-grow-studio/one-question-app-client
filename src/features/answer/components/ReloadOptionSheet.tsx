import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Pressable, StyleSheet, View, Text, Modal, PanResponder, BackHandler } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors } from '@/shared/theme';
import { MailIcon } from '@/shared/icons/MailIcon';
import { PastQuestionIcon } from '@/shared/icons/PastQuestionIcon';
import { fs, sp, radius, cs, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/utils/responsive';

const DISMISS_THRESHOLD = 100;

type ReloadOptionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onRandomQuestion: () => void;
  onPastQuestion: () => void;
};

export function ReloadOptionSheet({
  visible,
  onClose,
  onRandomQuestion,
  onPastQuestion,
}: ReloadOptionSheetProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'common']);

  // Use standard sheet height constant
  const SHEET_HEIGHT = SHEET_HEIGHTS.medium;

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const startY = useRef(0);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity, SHEET_HEIGHT]);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible, openSheet]);

  // Android back button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startY.current = translateY.value;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        const newValue = Math.max(0, startY.current + gestureState.dy);
        translateY.value = newValue;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      },
    })
  ).current;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleRandomQuestion = () => {
    onRandomQuestion();
    closeSheet();
  };

  const handlePastQuestion = () => {
    onPastQuestion();
  };

  const handleBackdropPress = () => {
    closeSheet();
  };

  const responsiveStyles = useMemo(() => ({
    sheetContainer: {
      height: SHEET_HEIGHT,
      maxWidth: SHEET_MAX_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
      borderTopLeftRadius: radius(24),
      borderTopRightRadius: radius(24),
    },
    handleContainer: {
      paddingVertical: sp(16),
      paddingHorizontal: sp(20),
    },
    contentContainer: {
      paddingHorizontal: sp(16),
    },
    title: {
      fontSize: fs(18),
      marginBottom: sp(4),
    },
    message: {
      fontSize: fs(14),
      marginBottom: sp(20),
    },
    optionButton: {
      padding: sp(16),
      borderRadius: radius(16),
    },
    optionIcon: {
      width: cs(44),
      height: cs(44),
      borderRadius: radius(12),
    },
    optionTextContainer: {
      marginLeft: sp(14),
    },
    optionTitle: {
      fontSize: fs(16),
      marginBottom: sp(2),
    },
    optionDescription: {
      fontSize: fs(13),
    },
    comingSoonBadge: {
      paddingHorizontal: sp(10),
      paddingVertical: sp(4),
      borderRadius: radius(8),
    },
    comingSoonText: {
      fontSize: fs(12),
    },
    cancelButton: {
      marginTop: sp(12),
      paddingVertical: sp(16),
      borderRadius: radius(16),
    },
    cancelText: {
      fontSize: fs(16),
    },
  }), [SHEET_HEIGHT]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
      {/* Backdrop */}
      <Pressable style={styles.backdropContainer} onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          responsiveStyles.sheetContainer,
          sheetStyle,
          { backgroundColor: theme.surface?.val },
        ]}
      >
        {/* Handle - Draggable area */}
        <View {...panResponder.panHandlers} style={[styles.handleContainer, responsiveStyles.handleContainer]}>
          <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, responsiveStyles.contentContainer]}>
          {/* Title */}
          <Text style={[styles.title, responsiveStyles.title, { color: theme.color?.val }]}>
            {t('answer:reload.title')}
          </Text>
          <Text style={[styles.message, responsiveStyles.message, { color: theme.colorMuted?.val }]}>
            {t('answer:reload.message')}
          </Text>

          {/* Options */}
          <YStack style={styles.optionsContainer}>
            {/* Random Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                responsiveStyles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handleRandomQuestion}
            >
              <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: accent.primary }]}>
                <MailIcon size={cs(22)} color={accent.textOnPrimary} />
              </View>
              <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                  {t('answer:reload.randomQuestion')}
                </Text>
                <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.randomQuestionDesc')}
                </Text>
              </YStack>
            </Pressable>

            {/* Past Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                responsiveStyles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handlePastQuestion}
            >
              <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: theme.backgroundSoft?.val }]}>
                <PastQuestionIcon size={cs(22)} color={theme.colorMuted?.val} />
              </View>
              <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                  {t('answer:reload.pastQuestion')}
                </Text>
                <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.pastQuestionDesc')}
                </Text>
              </YStack>
              <View style={[styles.comingSoonBadge, responsiveStyles.comingSoonBadge, { backgroundColor: theme.backgroundSoft?.val }]}>
                <Text style={[styles.comingSoonText, responsiveStyles.comingSoonText, { color: theme.colorMuted?.val }]}>
                  {t('common:status.comingSoon')}
                </Text>
              </View>
            </Pressable>
          </YStack>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              responsiveStyles.cancelButton,
              {
                backgroundColor: pressed ? theme.backgroundSoft?.val : theme.background?.val,
                borderColor: theme.borderColor?.val,
              },
            ]}
            onPress={() => closeSheet()}
          >
            <Text style={[styles.cancelText, responsiveStyles.cancelText, { color: theme.color?.val }]}>
              {t('common:buttons.cancel')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handleContainer: {
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: '600',
  },
  optionDescription: {},
  comingSoonBadge: {},
  comingSoonText: {
    fontWeight: '500',
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
});
