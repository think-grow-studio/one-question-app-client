import { Modal, View, Pressable } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
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
  const theme = useTheme();

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
            backgroundColor: theme.background?.val,
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
              backgroundColor: theme.borderColor?.val,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Title */}
          <Text variant="body" fontWeight="600" fontSize={18} mb="$4">
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
                    selectedMode === mode ? theme.backgroundSoft?.val : 'transparent',
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
                        selectedMode === mode ? theme.primary?.val : theme.borderColor?.val,
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
                          backgroundColor: theme.primary?.val,
                        }}
                      />
                    )}
                  </View>

                  {/* Label */}
                  <Text
                    variant="body"
                    fontWeight={selectedMode === mode ? '600' : '400'}
                    muted={selectedMode !== mode}
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
