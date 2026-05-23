import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, radius, cs } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/shared/utils/nicknameCharacter';
import { formatFeedDate } from '../utils/feedUtils';
import type { FeedItemDomain } from '../types/api';

interface AnswerCardProps {
  item: FeedItemDomain;
  onPress?: () => void;
}

export function AnswerCard({ item, onPress }: AnswerCardProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  const handleToggleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.background?.val ?? '#ffffff',
          ...Platform.select({
            ios: {
              shadowColor: theme.color?.val ?? '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            },
            android: {
              elevation: 1,
            },
          }),
          transform: [{ scale: pressed && onPress ? 0.99 : 1 }],
        },
      ]}
    >
      <YStack gap={sp(8)}>
        {/* Top: nickname · date */}
        <XStack alignItems="center" gap={sp(6)}>
          <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
            {item.anonymousNickname}
          </Text>
          <Image
            source={pickNicknameCharacter(item.anonymousNickname)}
            style={styles.avatar}
            resizeMode="contain"
          />
          <Text muted style={styles.metaDot}>·</Text>
          <Text muted style={styles.meta}>
            {formatFeedDate(item.postedAt)}
          </Text>
        </XStack>

        {/* Answer content */}
        <Text style={styles.answerText}>
          {item.answerContent}
        </Text>

        {/* Bottom: like */}
        <XStack justifyContent="flex-end" alignItems="center">
          <Pressable
            onPress={handleToggleLike}
            hitSlop={10}
            style={({ pressed }) => [
              styles.likeButton,
              {
                backgroundColor: liked ? `${accent.like}14` : 'transparent',
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <HeartIcon
              size={cs(14)}
              color={liked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={liked}
            />
            <Text
              color={liked ? accent.like : '$colorMuted'}
              style={styles.likeCount}
              {...getFontStyle('600')}
            >
              {likeCount}
            </Text>
          </Pressable>
        </XStack>
      </YStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sp(20),
    marginVertical: sp(4),
    paddingVertical: sp(12),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
  },
  nickname: {
    fontSize: fs(13),
    letterSpacing: -0.2,
  },
  avatar: {
    width: cs(22),
    height: cs(22),
  },
  metaDot: {
    fontSize: fs(11),
  },
  answerText: {
    fontSize: fs(15),
    lineHeight: fs(23),
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: fs(11),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingVertical: sp(6),
    paddingHorizontal: sp(10),
    borderRadius: radius(14),
  },
  likeCount: {
    fontSize: fs(12),
  },
});
