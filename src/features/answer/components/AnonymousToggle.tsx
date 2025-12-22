import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

interface AnonymousToggleProps {
  value: boolean;
  onToggle: (nextValue: boolean) => void;
}

export function AnonymousToggle({ value, onToggle }: AnonymousToggleProps) {
  const handleToggle = () => {
    onToggle(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        value ? styles.justifyEnd : styles.justifyStart,
        pressed && styles.trackPressed,
      ]}
    >
      <View style={styles.thumb} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 32,
    borderRadius: 20,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackOn: {
    backgroundColor: colors.systemBlue,
  },
  trackOff: {
    backgroundColor: colors.systemGray4,
  },
  trackPressed: {
    opacity: 0.85,
  },
  justifyStart: {
    justifyContent: 'flex-start',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
});
