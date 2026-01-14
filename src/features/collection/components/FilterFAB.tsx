import { Pressable } from 'react-native';
import { useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';

interface FilterFABProps {
  onPress: () => void;
}

export function FilterFAB({ onPress }: FilterFABProps) {
  const theme = useTheme();

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
        backgroundColor: pressed ? theme.primaryHover?.val : theme.primary?.val,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      })}
    >
      <Text variant="body" fontWeight="600" color="#FFFFFF" fontSize={18}>
        ⚙️
      </Text>
    </Pressable>
  );
}
