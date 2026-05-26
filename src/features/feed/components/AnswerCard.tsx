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
  /**
   * 서버 토글 결과의 `liked` 값을 반환. 호출부(부모)가 mutation 을 소유하므로
   * `item.answerPostId` 외에 `pdqId` 같은 컨텍스트를 카드가 알 필요가 없다.
   * 미지정 시 로컬 토글만 수행 (mock / preview 환경 호환).
   */
  onToggleLike?: (item: FeedItemDomain) => Promise<boolean> | boolean;
  /** 본인 답변 등 좋아요 누를 수 없는 경우. */
  likeDisabled?: boolean;
}

export function AnswerCard({ item, onPress, onToggleLike, likeDisabled }: AnswerCardProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  const handleToggleLike = async () => {
    if (likeDisabled) return;
    // async 대기 중 리렌더가 발생해도 stale closure 없이 동작하도록
    // 호출 시점 값을 const 로 캡처한 뒤 직접 setter 호출.
    const prevLiked = liked;
    const nextLiked = !prevLiked;

    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    if (!onToggleLike) return;
    try {
      const serverLiked = !!(await Promise.resolve(onToggleLike(item)));
      if (serverLiked !== nextLiked) {
        setLiked(serverLiked);
        setLikeCount((c) => c + (serverLiked ? 1 : -1));
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount((c) => c + (prevLiked ? 1 : -1));
    }
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
          <Text style={[styles.meta, { color: accent.primary }]}>
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
            disabled={likeDisabled}
            hitSlop={10}
            style={({ pressed }) => [
              styles.likeButton,
              {
                backgroundColor: liked ? `${accent.like}14` : 'transparent',
                opacity: likeDisabled ? 0.5 : 1,
                transform: [{ scale: pressed && !likeDisabled ? 0.94 : 1 }],
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
