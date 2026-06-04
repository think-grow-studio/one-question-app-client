import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { XStack, YStack, useTheme } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { HeartIcon } from '@/shared/icons/HeartIcon';
import { EditIcon } from '@/shared/icons/EditIcon';
import { TrashIcon } from '@/shared/icons/TrashIcon';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { useAccentColors } from '@/shared/theme';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp, radius, cs } from '@/shared/utils/responsive';
import { pickNicknameCharacter } from '@/shared/utils/nicknameCharacter';
import { formatFeedDate } from '../utils/feedUtils';
import type { FeedItemDomain } from '../types/api';

interface MyAnswerCardProps {
  item: FeedItemDomain;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MyAnswerCard({ item, onEdit, onDelete }: MyAnswerCardProps) {
  const { t } = useTranslation('feed');
  const theme = useTheme();
  const accent = useAccentColors();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          // 카드는 surface — 다크에서 화면 배경(#1C1C1E)과 구분되는 연한 검정(#2C2C2E)
          backgroundColor: theme.surface?.val ?? '#ffffff',
          borderColor: accent.primary,
        },
      ]}
    >
      <YStack gap={sp(12)}>
        {/* Top: nickname · date + like count */}
        <XStack ai="center" jc="space-between">
          <XStack ai="center" gap={sp(6)} flex={1}>
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

          <XStack ai="center" gap={sp(4)}>
            <HeartIcon
              size={cs(12)}
              color={item.liked ? accent.like : (theme.colorMuted?.val ?? '#999')}
              filled={item.liked}
            />
            <Text
              color={item.liked ? accent.like : '$colorMuted'}
              style={styles.likeCount}
              {...getFontStyle('600')}
            >
              {item.likeCount}
            </Text>
          </XStack>
        </XStack>

        {/* Answer body — 3줄까지 노출, 초과 시 ... 로 잘림. AnswerCard 와 동일 정책. */}
        <Text style={styles.answerText} numberOfLines={3} ellipsizeMode="tail">
          {item.answerContent}
        </Text>

        {/* Bottom row: edit / delete buttons */}
        {(onEdit || onDelete) ? (
          <XStack jc="flex-end" gap={sp(8)}>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('editAnswer.button')}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <EditIcon size={cs(18)} color={accent.primary} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={() => setConfirmVisible(true)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('deleteAnswer.button')}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <TrashIcon size={cs(18)} color="#EF4444" />
              </Pressable>
            ) : null}
          </XStack>
        ) : null}
      </YStack>

      <AlertDialog
        visible={confirmVisible}
        title={t('deleteAnswer.confirmTitle')}
        message={t('deleteAnswer.confirmMessage')}
        buttons={[
          {
            label: t('deleteAnswer.cancelButton'),
            variant: 'default',
          },
          {
            label: t('deleteAnswer.confirmButton'),
            variant: 'primary',
            onPress: () => {
              setConfirmVisible(false);
              onDelete?.();
            },
          },
        ]}
        onClose={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sp(20),
    marginVertical: sp(14),
    paddingTop: sp(14),
    paddingBottom: sp(14),
    paddingHorizontal: sp(18),
    borderRadius: radius(16),
    borderWidth: 1.25,
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
  meta: {
    fontSize: fs(11),
  },
  answerText: {
    fontSize: fs(14),
    lineHeight: fs(21),
    letterSpacing: -0.2,
  },
  likeCount: {
    fontSize: fs(11),
  },
  actionBtn: {
    padding: sp(4),
  },
});
