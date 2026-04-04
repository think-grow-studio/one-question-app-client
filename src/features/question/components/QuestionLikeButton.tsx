import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';
import { useQueryClient } from '@tanstack/react-query';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { useThemeStore } from '@/shared/stores/useThemeStore';
import { sp, radius, cs } from '@/shared/utils/responsive';
import { useToggleQuestionLike } from '../hooks/mutations/useQuestionLikeMutations';
import { questionQueryKeys } from '../hooks/queries/useQuestionQueries';
import type { DailyQuestionDomain } from '../domain/questionDomain';

interface QuestionLikeButtonProps {
  questionId: number;
  date: string;
  initialLiked: boolean;
}

export function QuestionLikeButton({ questionId, initialLiked, date }: QuestionLikeButtonProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const queryClient = useQueryClient();
  const toggleMutation = useToggleQuestionLike();

  const [liked, setLiked] = useState(initialLiked);

  useEffect(() => {
    setLiked(initialLiked);
  }, [questionId, initialLiked]);

  const handleToggle = () => {
    const prevLiked = liked;
    setLiked(!prevLiked);

    toggleMutation.mutate(questionId, {
      onSuccess: (data) => {
        setLiked(data.liked);
        queryClient.setQueryData<DailyQuestionDomain | null>(
          questionQueryKeys.daily(date),
          (prev) => {
            if (!prev || !prev.question || prev.question.questionId !== questionId) {
              return prev;
            }

            return {
              ...prev,
              question: {
                ...prev.question,
                liked: data.liked,
              },
            };
          }
        );
      },
      onError: () => {
        setLiked(prevLiked);
      },
    });
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: liked
            ? `${accent.like}1A`
            : (isDark ? theme.background?.val : theme.backgroundSoft?.val) ?? '#f5f5f5',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <HeartIcon
        size={cs(18)}
        color={liked ? accent.like : (theme.colorMuted?.val ?? '#999')}
        filled={liked}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp(6),
    borderRadius: radius(16),
  },
});
