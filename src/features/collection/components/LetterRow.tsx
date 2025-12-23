import { Pressable, View } from 'react-native';
import { Text } from 'tamagui';
import { Letter } from '../types/api';

interface LetterRowProps {
  letter: Letter;
  isExpanded: boolean;
  onToggle: () => void;
}

export function LetterRow({ letter, isExpanded, onToggle }: LetterRowProps) {
  return (
    <View>
      <Pressable onPress={onToggle}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}>
          {/* Date */}
          <Text size="$2" color="$gray10">
            {letter.date}
          </Text>

          {/* Question */}
          <Text size="$5" weight="600" numberOfLines={2} color="$color">
            {letter.question}
          </Text>

          {/* Category Badge */}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E5E5EA',
              alignSelf: 'flex-start',
            }}
          >
            <Text size="$2" color="$gray10">
              {letter.category}
            </Text>
          </View>

          {/* Answer Preview or Full */}
          <Text
            size="$4"
            color="$gray8"
            numberOfLines={isExpanded ? undefined : 2}
          >
            {letter.answer}
          </Text>

          {/* Expanded Actions */}
          {isExpanded && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopColor: '#F0F0F0', borderTopWidth: 1 }}>
              <Pressable>
                <Text size="$4" color="$blue10">
                  이 질문의 커뮤니티 보기
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />
    </View>
  );
}
