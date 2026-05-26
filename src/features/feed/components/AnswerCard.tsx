import { memo } from 'react';
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
   * 좋아요 토글 요청. 캐시 낙관 업데이트 / 롤백은 mutation hook 이 담당하므로
   * 카드는 fire-and-forget 으로 호출만 한다. `liked` / `likeCount` 는 `item` prop
   * (= 캐시 = single source of truth) 을 그대로 렌더.
   */
  onToggleLike?: (item: FeedItemDomain) => void;
  /** 본인 답변 등 좋아요 누를 수 없는 경우. */
  likeDisabled?: boolean;
}

function AnswerCardImpl({ item, onPress, onToggleLike, likeDisabled }: AnswerCardProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  const handleToggleLike = () => {
    if (likeDisabled) return;
    onToggleLike?.(item);
  };

  const liked = item.liked;
  const likeCount = item.likeCount;

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

        {/* Answer content — 3줄 까지 노출, 초과 시 ... 로 잘림. 전체는 추후 상세 시트에서. */}
        <Text style={styles.answerText} numberOfLines={3} ellipsizeMode="tail">
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

// FlashList 안에서 캐시 변경으로 부모가 리렌더돼도 같은 item ref 면 skip.
// 좋아요 토글로 변경된 카드만 다시 렌더 (§18.1 useMemo / React.memo).
export const AnswerCard = memo(AnswerCardImpl);

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
