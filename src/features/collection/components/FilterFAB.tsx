import { Pressable, View } from 'react-native';
import { Text } from 'tamagui';

interface FilterFABProps {
  onPress: () => void;
}

export function FilterFAB({ onPress }: FilterFABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: 24,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: pressed ? '#0A66D1' : '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      })}
    >
      <Text size="$5" weight="600" color="$white">
        ⚙️
      </Text>
    </Pressable>
  );
}
