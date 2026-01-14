import { View, Pressable, TextInput } from 'react-native';
import { useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { useState } from 'react';

interface DateFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
}

export function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateFilterProps) {
  const theme = useTheme();
  const [startInput, setStartInput] = useState(startDate || '');
  const [endInput, setEndInput] = useState(endDate || '');

  const handleStartDateChange = (text: string) => {
    setStartInput(text);
    if (text.length === 10) {
      // Format: YYYY-MM-DD
      onStartDateChange(text);
    }
  };

  const handleEndDateChange = (text: string) => {
    setEndInput(text);
    if (text.length === 10) {
      // Format: YYYY-MM-DD
      onEndDateChange(text);
    }
  };

  const handleReset = () => {
    setStartInput('');
    setEndInput('');
    onStartDateChange(null);
    onEndDateChange(null);
  };

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: theme.borderColor?.val,
        borderBottomWidth: 1,
        backgroundColor: theme.background?.val,
        gap: 12,
      }}
    >
      {/* Label */}
      <Text variant="bodySmall" fontWeight="600" muted>
        기간 선택 (YYYY-MM-DD)
      </Text>

      {/* Date Inputs */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {/* Start Date */}
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="시작일"
            value={startInput}
            onChangeText={handleStartDateChange}
            placeholderTextColor={theme.placeholderColor?.val}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderColor: theme.borderColor?.val,
              borderWidth: 1,
              fontSize: 13,
              color: theme.color?.val,
              backgroundColor: theme.background?.val,
            }}
          />
        </View>

        {/* Separator */}
        <Text variant="bodySmall" muted>
          ~
        </Text>

        {/* End Date */}
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="종료일"
            value={endInput}
            onChangeText={handleEndDateChange}
            placeholderTextColor={theme.placeholderColor?.val}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderColor: theme.borderColor?.val,
              borderWidth: 1,
              fontSize: 13,
              color: theme.color?.val,
              backgroundColor: theme.background?.val,
            }}
          />
        </View>

        {/* Reset Button */}
        <Pressable
          onPress={handleReset}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: theme.backgroundSoft?.val,
          }}
        >
          <Text variant="caption" muted>
            초기화
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
