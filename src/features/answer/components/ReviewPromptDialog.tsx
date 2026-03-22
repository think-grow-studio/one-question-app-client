import { Modal, View, Text, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from 'tamagui';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { fs, sp, radius, deviceValue } from '@/utils/responsive';

export interface ReviewPromptDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onAccept: () => void; // 리뷰하기
  onLater: () => void; // 나중에
  acceptLabel: string;
  laterLabel: string;
}

export function ReviewPromptDialog({
  visible,
  title,
  message,
  onAccept,
  onLater,
  acceptLabel,
  laterLabel,
}: ReviewPromptDialogProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  if (!visible) return null;

  const responsiveStyles = {
    centeredContainer: {
      paddingHorizontal: sp(24),
    },
    dialogContainer: {
      maxWidth: deviceValue(360, 520),
      borderRadius: radius(24),
      paddingTop: sp(32),
      paddingBottom: sp(24),
      paddingHorizontal: sp(28),
    },
    title: {
      fontSize: fs(19),
      marginBottom: sp(12),
    },
    message: {
      fontSize: fs(15),
      lineHeight: fs(22),
      marginBottom: sp(28),
    },
    buttonContainer: {
      gap: sp(12),
    },
    button: {
      paddingVertical: sp(16),
      borderRadius: radius(14),
    },
    buttonText: {
      fontSize: fs(15),
    },
  };

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      {/* Backdrop - 클릭 불가 */}
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.backdropOverlay} />
        </View>
      </TouchableWithoutFeedback>

      {/* Dialog Content */}
      <View style={[styles.centeredContainer, responsiveStyles.centeredContainer]} pointerEvents="box-none">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.dialogContainer,
            responsiveStyles.dialogContainer,
            { backgroundColor: theme.surface?.val },
          ]}
        >
          {/* Title */}
          <Text style={[styles.title, responsiveStyles.title, { color: theme.color?.val }]}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={[styles.message, responsiveStyles.message, { color: theme.colorMuted?.val }]}>
              {message}
            </Text>
          )}

          {/* Buttons Container */}
          <View style={[styles.buttonContainer, responsiveStyles.buttonContainer]}>
            {/* 리뷰하기 */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                responsiveStyles.button,
                { backgroundColor: accent.primary, borderColor: accent.primary },
                pressed && { opacity: 0.8 },
              ]}
              onPress={onAccept}
            >
              <Text style={[styles.buttonText, responsiveStyles.buttonText, { color: accent.textOnPrimary }]}>
                {acceptLabel}
              </Text>
            </Pressable>

            {/* 나중에 */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                responsiveStyles.button,
                { backgroundColor: theme.backgroundSoft?.val, borderColor: theme.borderColor?.val },
                pressed && { opacity: 0.8 },
              ]}
              onPress={onLater}
            >
              <Text style={[styles.buttonText, responsiveStyles.buttonText, { color: theme.color?.val }]}>
                {laterLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...getFontStyle('700'),
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
  },
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    ...getFontStyle('600'),
    textAlign: 'center',
  },
});
