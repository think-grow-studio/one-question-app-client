import { Modal, Pressable, StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';
import { fs, sp, radius, deviceValue } from '@/utils/responsive';

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
  dismissible?: boolean;
};

export function AlertDialog({
  visible,
  title,
  message,
  buttons = [{ label: '확인', variant: 'primary' }],
  onClose,
  dismissible = true,
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
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={dismissible ? onClose : undefined}>
        <View style={styles.backdrop}>
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.backdropOverlay} />
        </View>
      </TouchableWithoutFeedback>

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
            <Text style={[styles.message, responsiveStyles.message, { color: theme.colorMuted?.val }]}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={[styles.buttonContainer, responsiveStyles.buttonContainer]}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.button,
                  responsiveStyles.button,
                  getButtonStyle(button.variant),
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text style={[styles.buttonText, responsiveStyles.buttonText, getButtonTextStyle(button.variant)]}>
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
  },
  dialogContainer: {
    width: '100%',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '600',
  },
});
