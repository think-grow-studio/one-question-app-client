import { Modal, View, Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';
import { ViewMode } from '../types/store';

interface FilterModalProps {
  visible: boolean;
  selectedMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onClose: () => void;
}

const MODES: ViewMode[] = ['카테고리', '날짜'];

export function FilterModal({
  visible,
  selectedMode,
  onModeChange,
  onClose,
}: FilterModalProps) {
  const handleModeSelect = (mode: ViewMode) => {
    onModeChange(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Bottom Sheet */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 20,
            paddingBottom: 32,
          }}
        >
          {/* Handle Bar */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: '#D1D1D6',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Title */}
          <Text size="$5" weight="600" mb="$4">
            보기 방식 선택
          </Text>

          {/* Options */}
          <YStack gap="$2">
            {MODES.map((mode) => (
              <Pressable
                key={mode}
                onPress={() => handleModeSelect(mode)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 10,
                  backgroundColor:
                    selectedMode === mode ? '#F2F2F7' : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Radio Button */}
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        selectedMode === mode ? '#007AFF' : '#E5E5EA',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {selectedMode === mode && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#007AFF',
                        }}
                      />
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    size="$4"
                    color={
                      selectedMode === mode
                        ? '$color'
                        : '$gray9'
                    }
                    weight={selectedMode === mode ? '600' : '400'}
                  >
                    {mode}
                  </Text>
                </View>
              </Pressable>
            ))}
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
