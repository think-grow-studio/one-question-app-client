import { Pressable } from 'react-native';
import { YStack, XStack, Separator } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { Letter } from '../types/api';

interface LetterRowProps {
  letter: Letter;
  isExpanded: boolean;
  onToggle: () => void;
}

export function LetterRow({ letter, isExpanded, onToggle }: LetterRowProps) {
  return (
    <YStack>
      <Pressable onPress={onToggle}>
        <YStack px="$4" py="$4" gap="$2">
          {/* Date */}
          <Text variant="caption" muted>
            {letter.date}
          </Text>

          {/* Question */}
          <Text variant="body" fontWeight="600" numberOfLines={2}>
            {letter.question}
          </Text>

          {/* Category Badge */}
          <XStack
            px="$2"
            py="$1"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
            alignSelf="flex-start"
          >
            <Text variant="caption" muted>
              {letter.category}
            </Text>
          </XStack>

          {/* Answer Preview or Full */}
          <Text
            variant="bodySmall"
            muted
            numberOfLines={isExpanded ? undefined : 2}
          >
            {letter.answer}
          </Text>

          {/* Expanded Actions */}
          {isExpanded && (
            <YStack mt="$3" pt="$3" borderTopWidth={1} borderTopColor="$borderColor">
              <Pressable>
                <Text variant="bodySmall" color="$primary">
                  이 질문의 커뮤니티 보기
                </Text>
              </Pressable>
            </YStack>
          )}
        </YStack>
      </Pressable>

      {/* Separator */}
      <Separator />
    </YStack>
  );
}
