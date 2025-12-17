import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  enabled?: boolean;
  onPress: () => void;
}

export function Button({ label, enabled = true, onPress, ...props }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.button,
        enabled ? styles.buttonEnabled : styles.buttonDisabled,
        pressed && enabled && styles.buttonPressed,
      ]}
      {...props}
    >
      <Text style={[styles.label, !enabled && styles.labelDisabled]}>
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
  },
  buttonEnabled: {
    backgroundColor: colors.systemBlue,
  },
  buttonDisabled: {
    backgroundColor: colors.systemGray5,
  },
  buttonPressed: {
    backgroundColor: colors.systemBluePressed,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
});
