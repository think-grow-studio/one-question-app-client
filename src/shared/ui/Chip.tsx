import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { colors } from '@/constants/colors';

interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected = false, onPress, ...props }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && !selected && styles.chipPressed,
      ]}
      {...props}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipUnselected: {
    backgroundColor: colors.systemGray6,
  },
  chipSelected: {
    backgroundColor: colors.systemBlue,
  },
  chipPressed: {
    backgroundColor: colors.systemGray5,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.white,
  },
});
