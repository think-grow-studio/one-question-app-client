import { Modal, Pressable, StyleSheet, View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';

export type AlertDialogButton = {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'destructive';
};

export type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertDialogButton[];
  onClose: () => void;
};

export function AlertDialog({
  visible,
  title,
  message,
  buttons = [{ label: '확인', variant: 'primary' }],
  onClose,
}: AlertDialogProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const getButtonStyle = (variant: AlertDialogButton['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: accent.primary,
          borderColor: accent.primary,
        };
      case 'destructive':
        return {
          backgroundColor: theme.error?.val,
          borderColor: theme.error?.val,
        };
      default:
        return {
          backgroundColor: theme.backgroundSoft?.val,
          borderColor: theme.borderColor?.val,
        };
    }
  };

  const getButtonTextStyle = (variant: AlertDialogButton['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return { color: accent.textOnPrimary };
      case 'destructive':
        return { color: '#FFFFFF' };
      default:
        return { color: theme.color?.val };
    }
  };

  const handleButtonPress = (button: AlertDialogButton) => {
    button.onPress?.();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.backdropOverlay} />
      </Pressable>

      <View style={styles.centeredContainer}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.dialogContainer, { backgroundColor: theme.surface?.val }]}
        >
          {/* Title */}
          <Text style={[styles.title, { color: theme.color?.val }]}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: theme.colorMuted?.val }]}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.button,
                  getButtonStyle(button.variant),
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text style={[styles.buttonText, getButtonTextStyle(button.variant)]}>
                  {button.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
