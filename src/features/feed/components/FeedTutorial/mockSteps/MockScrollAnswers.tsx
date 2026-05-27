import { Image, Platform, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { cs, fs, radius, sp } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/shared/utils/nicknameCharacter';

interface MiniCard {
  nickname: string;
  meta: string;
  answer: string;
  liked: boolean;
  likeCount: number;
}

const MINI_CARDS: MiniCard[] = [
  {
    nickname: '고요한 강아지',
    meta: '방금',
    answer: '비 오는 날 창가에 앉아서 책 읽을 때가 가장 행복해요. 빗소리만 들리는 그 시간이요.',
    liked: true,
    likeCount: 12,
  },
  {
    nickname: '달빛 바람',
    meta: '3분 전',
    answer: '아침에 따뜻한 커피 한 잔과 함께하는 산책. 별 거 아닌데 그게 하루를 살려요.',
    liked: false,
    likeCount: 4,
  },
];

export function MockScrollAnswers() {
  const theme = useTheme();
  const accent = useAccentColors();
  const bg = theme.background?.val ?? '#ffffff';
  const mutedColor = theme.colorMuted?.val ?? '#999';

  return (
    <View style={styles.wrap}>
      <YStack gap={sp(8)}>
        {MINI_CARDS.map((card) => (
          <View
            key={card.nickname}
            style={[
              styles.card,
              {
                backgroundColor: bg,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.color?.val ?? '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                  },
                  android: {
                    elevation: 1,
                  },
                }),
              },
            ]}
          >
            <YStack gap={sp(6)}>
              {/* Top: nickname · avatar · date — 실제 AnswerCard 와 동일 구성. */}
              <XStack alignItems="center" gap={sp(6)}>
                <Text style={styles.nickname} {...getFontStyle('600')} numberOfLines={1}>
                  {card.nickname}
                </Text>
                <Image
                  source={pickNicknameCharacter(card.nickname)}
                  style={styles.avatar}
                  resizeMode="contain"
                />
                <Text muted style={styles.metaDot}>
                  ·
                </Text>
                <Text style={[styles.meta, { color: accent.primary }]}>{card.meta}</Text>
              </XStack>

              {/* Answer — 2줄로 실제 카드(3줄) 분위기를 가깝게 재현. */}
              <Text style={styles.answerText} numberOfLines={2} ellipsizeMode="tail">
                {card.answer}
              </Text>

              {/* Bottom: like button — 실제 AnswerCard 와 동일한 시각 정체성. */}
              <XStack justifyContent="flex-end" alignItems="center">
                <View
                  style={[
                    styles.likeButton,
                    {
                      backgroundColor: card.liked ? `${accent.like}14` : 'transparent',
                    },
                  ]}
                >
                  <HeartIcon
                    size={cs(13)}
                    color={card.liked ? accent.like : mutedColor}
                    filled={card.liked}
                  />
                  <Text
                    style={[
                      styles.likeCount,
                      { color: card.liked ? accent.like : mutedColor },
                    ]}
                    {...getFontStyle('600')}
                  >
                    {card.likeCount}
                  </Text>
                </View>
              </XStack>
            </YStack>
          </View>
        ))}
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    paddingVertical: sp(12),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
  },
  // 공유 Text 의 body variant lineHeight:24 상속 끊기 위해 fs 보다 살짝 큰 명시값.
  nickname: {
    fontSize: fs(13),
    lineHeight: fs(18),
    letterSpacing: -0.2,
  },
  avatar: {
    width: cs(20),
    height: cs(20),
  },
  metaDot: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  meta: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
  answerText: {
    fontSize: fs(14),
    lineHeight: fs(20),
    letterSpacing: -0.2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(5),
    paddingVertical: sp(4),
    paddingHorizontal: sp(8),
    borderRadius: radius(12),
  },
  likeCount: {
    fontSize: fs(11),
    lineHeight: fs(15),
  },
});
