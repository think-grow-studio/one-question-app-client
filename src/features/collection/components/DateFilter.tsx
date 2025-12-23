import { View, Pressable, TextInput } from 'react-native';
import { Text } from 'tamagui';
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
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
        backgroundColor: '#FFFFFF',
        gap: 12,
      }}
    >
      {/* Label */}
      <Text size="$3" weight="600" color="$gray10">
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
            placeholderTextColor="#A9A9B0"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderColor: '#E5E5EA',
              borderWidth: 1,
              fontSize: 13,
              color: '#191919',
            }}
          />
        </View>

        {/* Separator */}
        <Text size="$3" color="$gray10">
          ~
        </Text>

        {/* End Date */}
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="종료일"
            value={endInput}
            onChangeText={handleEndDateChange}
            placeholderTextColor="#A9A9B0"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderColor: '#E5E5EA',
              borderWidth: 1,
              fontSize: 13,
              color: '#191919',
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
            backgroundColor: '#E5E5EA',
          }}
        >
          <Text size="$2" color="$gray10">
            초기화
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
