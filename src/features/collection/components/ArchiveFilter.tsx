import { View, Pressable } from 'react-native';
import { useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { ViewMode } from '../types/store';

interface ArchiveFilterProps {
  selectedMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const MODES: ViewMode[] = ['카테고리', '날짜'];

export function ArchiveFilter({ selectedMode, onModeChange }: ArchiveFilterProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.background?.val,
        borderBottomColor: theme.borderColor?.val,
        borderBottomWidth: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          backgroundColor: theme.backgroundSoft?.val,
          borderRadius: 8,
          padding: 4,
        }}
      >
        {MODES.map((mode) => (
          <Pressable
            key={mode}
            onPress={() => onModeChange(mode)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: selectedMode === mode ? theme.background?.val : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              variant="bodySmall"
              fontWeight={selectedMode === mode ? '600' : '400'}
              muted={selectedMode !== mode}
            >
              {mode}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
