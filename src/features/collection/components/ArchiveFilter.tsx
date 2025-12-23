import { View, Pressable } from 'react-native';
import { Text } from 'tamagui';
import { ViewMode } from '../types/store';

interface ArchiveFilterProps {
  selectedMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const MODES: ViewMode[] = ['전체', '질문별', '카테고리', '날짜'];

export function ArchiveFilter({ selectedMode, onModeChange }: ArchiveFilterProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          backgroundColor: '#F2F2F7',
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
              backgroundColor: selectedMode === mode ? '#FFFFFF' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              size="$3"
              color={selectedMode === mode ? '$color' : '$gray9'}
              weight={selectedMode === mode ? '600' : '400'}
            >
              {mode}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
