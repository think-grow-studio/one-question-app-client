import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, Text, Modal, PanResponder, BackHandler } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccentColors, getFontStyle } from '@/shared/theme';
import { MailIcon } from '@/shared/icons/MailIcon';
import { PastQuestionIcon } from '@/shared/icons/PastQuestionIcon';
import { AdBadge } from '@/shared/ui/ads/AdBadge';
import { BannerAdSlot } from '@/shared/ui/ads/BannerAdSlot';
import { useMemberMe } from '@/features/member/hooks/queries/useMemberQueries';
import { shouldHideAds } from '@/features/member/constants/permissions';
import { fs, sp, radius, cs, SHEET_HEIGHTS, SHEET_MAX_WIDTH } from '@/shared/utils/responsive';
import { useSelectCandidate } from '@/features/question/hooks/mutations/useQuestionMutations';
import type { CandidateDto } from '@/shared/types/api';

const DISMISS_THRESHOLD = 100;

type ReloadOptionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onRandomQuestion: () => void;
  onPastQuestion: () => void;
  randomRequiresAd?: boolean;
  candidates: CandidateDto[];
  date: string;
};

export function ReloadOptionSheet({
  visible,
  onClose,
  onRandomQuestion,
  onPastQuestion,
  randomRequiresAd = false,
  candidates,
  date,
}: ReloadOptionSheetProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation(['answer', 'common']);
  const { data: member } = useMemberMe();
  const isAdFreeMember = shouldHideAds(member?.permission);
  const { mutate: selectCandidate, isPending: isSelectPending } = useSelectCandidate();

  const hasCandidates = candidates.length > 1;
  const SHEET_HEIGHT = hasCandidates ? SHEET_HEIGHTS.large : SHEET_HEIGHTS.medium;

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const startY = useRef(0);

  const closeSheet = useCallback((afterClose?: () => void) => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
        if (afterClose) {
          runOnJS(afterClose)();
        }
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity, SHEET_HEIGHT]);

  const openSheet = useCallback(() => {
    translateY.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(0.5, { duration: 250 });
  }, [translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible, openSheet]);

  // Android back button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startY.current = translateY.value;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        const newValue = Math.max(0, startY.current + gestureState.dy);
        translateY.value = newValue;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      },
    })
  ).current;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleRandomQuestion = () => {
    closeSheet(onRandomQuestion);
  };

  const handlePastQuestion = () => {
    closeSheet(onPastQuestion);
  };

  const handleBackdropPress = () => {
    closeSheet();
  };

  const handleSelectCandidate = (candidateId: number) => {
    if (isSelectPending) return;
    closeSheet();
    selectCandidate(
      { date, candidateId },
      {
        onError: () => {
          Alert.alert(t('common:error.title'), t('answer:reload.selectError'));
        },
      }
    );
  };

  const responsiveStyles = useMemo(() => ({
    sheetContainer: {
      height: SHEET_HEIGHT,
      maxWidth: SHEET_MAX_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
      borderTopLeftRadius: radius(24),
      borderTopRightRadius: radius(24),
    },
    handleContainer: {
      paddingVertical: sp(16),
      paddingHorizontal: sp(20),
    },
    contentContainer: {
      paddingHorizontal: sp(16),
    },
    candidatesLabel: {
      fontSize: fs(13),
      marginBottom: sp(8),
    },
    candidateItem: {
      paddingVertical: sp(14),
      paddingHorizontal: sp(16),
      borderRadius: radius(16),
      marginBottom: sp(8),
    },
    candidateText: {
      fontSize: fs(15),
      flex: 1,
      lineHeight: fs(15) * 1.5,
    },
    divider: {
      marginVertical: sp(16),
    },
    title: {
      fontSize: fs(18),
      marginBottom: sp(4),
    },
    message: {
      fontSize: fs(14),
      marginBottom: sp(20),
    },
    optionButton: {
      padding: sp(16),
      borderRadius: radius(16),
    },
    optionIcon: {
      width: cs(44),
      height: cs(44),
      borderRadius: radius(12),
    },
    optionTextContainer: {
      marginLeft: sp(14),
    },
    optionTitle: {
      fontSize: fs(16),
      marginBottom: sp(2),
    },
    optionDescription: {
      fontSize: fs(13),
    },
    comingSoonBadge: {
      paddingHorizontal: sp(10),
      paddingVertical: sp(4),
      borderRadius: radius(8),
    },
    comingSoonText: {
      fontSize: fs(12),
    },
    cancelButton: {
      marginTop: sp(12),
      paddingVertical: sp(16),
      borderRadius: radius(16),
    },
    cancelText: {
      fontSize: fs(16),
    },
  }), [SHEET_HEIGHT]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={() => closeSheet()}>
      {/* Backdrop */}
      <Pressable style={styles.backdropContainer} onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          responsiveStyles.sheetContainer,
          sheetStyle,
          { backgroundColor: theme.surface?.val },
        ]}
      >
        {/* Handle - Draggable area */}
        <View {...panResponder.panHandlers} style={[styles.handleContainer, responsiveStyles.handleContainer]}>
          <View style={[styles.handle, { backgroundColor: theme.borderColor?.val }]} />
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, responsiveStyles.contentContainer]}>

          {/* 후보 질문 섹션 (2개 이상일 때만 표시) */}
          {hasCandidates && (
            <View style={styles.candidatesSection}>
              <Text style={[styles.candidatesLabel, responsiveStyles.candidatesLabel, { color: theme.colorMuted?.val }]}>
                {t('answer:reload.candidatesLabel')}
              </Text>
              <ScrollView
                scrollEnabled={candidates.length > 3}
                showsVerticalScrollIndicator={candidates.length > 3}
                style={candidates.length > 3 ? styles.candidatesScroll : undefined}
                nestedScrollEnabled
              >
                {candidates.map((candidate) => (
                  <Pressable
                    key={candidate.candidateId}
                    onPress={() => handleSelectCandidate(candidate.candidateId)}
                    disabled={isSelectPending}
                    style={({ pressed }) => [
                      styles.candidateItem,
                      responsiveStyles.candidateItem,
                      {
                        backgroundColor: candidate.isSelected
                          ? `${accent.primary}18`
                          : theme.backgroundSoft?.val ?? '#262627',
                      },
                      pressed && !candidate.isSelected && { opacity: 0.7 },
                      isSelectPending && !candidate.isSelected && { opacity: 0.45 },
                    ]}
                  >
                    {candidate.isSelected && (
                      <View style={[styles.candidateAccentBar, { backgroundColor: accent.primary }]} />
                    )}
                    <Text
                      style={[styles.candidateText, responsiveStyles.candidateText, { color: theme.color?.val }]}
                      numberOfLines={2}
                    >
                      {candidate.content}
                    </Text>
                    <View
                      style={[
                        styles.candidateRadio,
                        candidate.isSelected
                          ? { backgroundColor: accent.primary }
                          : { borderWidth: 2, borderColor: theme.borderColor?.val },
                      ]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
              <View style={[styles.divider, { backgroundColor: theme.borderColor?.val }]} />
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, responsiveStyles.title, { color: theme.color?.val }]}>
            {t('answer:reload.title')}
          </Text>
          <Text style={[styles.message, responsiveStyles.message, { color: theme.colorMuted?.val }]}>
            {t('answer:reload.message')}
          </Text>

          {/* Options */}
          <YStack style={styles.optionsContainer}>
            {/* Random Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                responsiveStyles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handleRandomQuestion}
            >
              <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: accent.primary }]}>
                <MailIcon size={cs(22)} color={accent.textOnPrimary} />
              </View>
              <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                    {t('answer:reload.randomQuestion')}
                  </Text>
                  {randomRequiresAd && <AdBadge size="compact" />}
                </View>
                <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.randomQuestionDesc')}
                </Text>
              </YStack>
            </Pressable>

            {/* Past Question Option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionButton,
                responsiveStyles.optionButton,
                { backgroundColor: pressed ? theme.backgroundSoft?.val : 'transparent' },
              ]}
              onPress={handlePastQuestion}
            >
              <View style={[styles.optionIcon, responsiveStyles.optionIcon, { backgroundColor: theme.backgroundSoft?.val }]}>
                <PastQuestionIcon size={cs(22)} color={theme.colorMuted?.val} />
              </View>
              <YStack style={[styles.optionTextContainer, responsiveStyles.optionTextContainer]}>
                <Text style={[styles.optionTitle, responsiveStyles.optionTitle, { color: theme.color?.val }]}>
                  {t('answer:reload.pastQuestion')}
                </Text>
                <Text style={[styles.optionDescription, responsiveStyles.optionDescription, { color: theme.colorMuted?.val }]}>
                  {t('answer:reload.pastQuestionDesc')}
                </Text>
              </YStack>
              <View style={[styles.comingSoonBadge, responsiveStyles.comingSoonBadge, { backgroundColor: theme.backgroundSoft?.val }]}>
                <Text style={[styles.comingSoonText, responsiveStyles.comingSoonText, { color: theme.colorMuted?.val }]}>
                  {t('common:status.comingSoon')}
                </Text>
              </View>
            </Pressable>
          </YStack>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              responsiveStyles.cancelButton,
              {
                backgroundColor: pressed ? theme.backgroundSoft?.val : theme.background?.val,
                borderColor: theme.borderColor?.val,
              },
            ]}
            onPress={() => closeSheet()}
          >
            <Text style={[styles.cancelText, responsiveStyles.cancelText, { color: theme.color?.val }]}>
              {t('common:buttons.cancel')}
            </Text>
          </Pressable>
        </View>

        {!isAdFreeMember && (
          <View style={{ paddingHorizontal: sp(16) }}>
            <BannerAdSlot disableSafeAreaPadding />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handleContainer: {
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  candidatesSection: {
    marginBottom: sp(4),
  },
  candidatesScroll: {
    maxHeight: sp(70) * 3, // 3개 항목 높이까지만 표시, 초과 시 스크롤
  },
  candidatesLabel: {
    ...getFontStyle('600'),
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  candidateAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  candidateText: {
    flex: 1,
    ...getFontStyle('500'),
  },
  candidateRadio: {
    width: cs(18),
    height: cs(18),
    borderRadius: cs(9),
    marginLeft: sp(10),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: sp(8),
    opacity: 0.3,
  },
  title: {
    ...getFontStyle('700'),
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...getFontStyle('600'),
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  optionDescription: {},
  comingSoonBadge: {},
  comingSoonText: {
    ...getFontStyle('500'),
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    ...getFontStyle('600'),
  },
});
