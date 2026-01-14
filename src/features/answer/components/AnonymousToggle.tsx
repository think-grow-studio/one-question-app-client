import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'tamagui';

interface AnonymousToggleProps {
  value: boolean;
  onToggle: (nextValue: boolean) => void;
}

export function AnonymousToggle({ value, onToggle }: AnonymousToggleProps) {
  const theme = useTheme();

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
        {
          backgroundColor: value ? theme.primary?.val : theme.borderColor?.val,
          justifyContent: value ? 'flex-end' : 'flex-start',
        },
        pressed && styles.trackPressed,
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: '#FFFFFF' }]} />
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
  trackPressed: {
    opacity: 0.85,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
});
