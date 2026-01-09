import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  enabled?: boolean;
  onPress: () => void;
  variant?: 'filled' | 'outlined';
}

export function Button({ label, enabled = true, onPress, variant = 'filled', ...props }: ButtonProps) {
  const isOutlined = variant === 'outlined';

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.button,
        isOutlined ? styles.buttonOutlined : (enabled ? styles.buttonEnabled : styles.buttonDisabled),
        pressed && enabled && (isOutlined ? styles.buttonOutlinedPressed : styles.buttonPressed),
      ]}
      {...props}
    >
      <Text style={[
        styles.label,
        isOutlined && styles.labelOutlined,
        !enabled && styles.labelDisabled
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  buttonEnabled: {
    backgroundColor: colors.systemBlue,
    borderColor: colors.systemBlue,
  },
  buttonDisabled: {
    backgroundColor: colors.systemGray5,
    borderColor: colors.systemGray5,
  },
  buttonPressed: {
    backgroundColor: colors.systemBluePressed,
    borderColor: colors.systemBluePressed,
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.systemBlue,
  },
  buttonOutlinedPressed: {
    backgroundColor: colors.cardPastelBlue,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  labelOutlined: {
    color: colors.systemBlue,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
});
