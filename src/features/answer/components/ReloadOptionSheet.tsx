import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, Text, Dimensions, Modal, PanResponder } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors } from '@/shared/theme';
import { MailIcon } from '@/shared/icons/MailIcon';
import { PastQuestionIcon } from '@/shared/icons/PastQuestionIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.42;
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
  }, [onClose, translateY, backdropOpacity]);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible, openSheet]);

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

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={styles.backdropContainer} onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          sheetStyle,
          { backgroundColor: theme.surface?.val },
        ]}
      >
        {/* Handle - Draggable area */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={[styles.title, { color: theme.color?.val }]}>
            {t('answer:reload.title')}
          </Text>
          <Text style={[styles.message, { color: theme.colorMuted?.val }]}>
            {t('answer:reload.message')}
          </Text>

          {/* Options */}
          <YStack style={styles.optionsContainer}>
            {/* Random Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handleRandomQuestion}
            >
              <View style={[styles.optionIcon, { backgroundColor: accent.primary }]}>
                <MailIcon size={22} color={accent.textOnPrimary} />
              </View>
              <YStack style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.color?.val }]}>
                  {t('answer:reload.randomQuestion')}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.randomQuestionDesc')}
                </Text>
              </YStack>
            </Pressable>

            {/* Past Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handlePastQuestion}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.backgroundSoft?.val }]}>
                <PastQuestionIcon size={22} color={theme.colorMuted?.val} />
              </View>
              <YStack style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.color?.val }]}>
                  {t('answer:reload.pastQuestion')}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.pastQuestionDesc')}
                </Text>
              </YStack>
              <View style={[styles.comingSoonBadge, { backgroundColor: theme.backgroundSoft?.val }]}>
                <Text style={[styles.comingSoonText, { color: theme.colorMuted?.val }]}>
                  {t('common:status.comingSoon')}
                </Text>
              </View>
            </Pressable>
          </YStack>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: pressed ? theme.backgroundSoft?.val : theme.background?.val,
                borderColor: theme.borderColor?.val,
              },
            ]}
            onPress={() => closeSheet()}
          >
            <Text style={[styles.cancelText, { color: theme.color?.val }]}>
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
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
