import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { YStack, XStack, useTheme } from 'tamagui';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { useAccentColors } from '@/shared/theme';
import { cs, fs, sp, radius, SHEET_MAX_WIDTH } from '@/utils/responsive';

const VISIBLE_ITEMS = 5;

interface TimePickerSheetProps {
  visible: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

export function TimePickerSheet({
  visible,
  hour,
  minute,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const theme = useTheme();
  const accent = useAccentColors();
  const { t } = useTranslation('settings');

  // Responsive values
  const ITEM_HEIGHT = cs(44);
  const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

  // 내부 상태
  const [isPM, setIsPM] = useState(hour >= 12);
  const [selectedHour, setSelectedHour] = useState(() => {
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return h;
  }); // 1-12
  const [selectedMinute, setSelectedMinute] = useState(minute);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // 시트 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      const newIsPM = hour >= 12;
      const newHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

      setIsPM(newIsPM);
      setSelectedHour(newHour);
      setSelectedMinute(minute);

      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: (newHour - 1) * ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: minute * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible, hour, minute, ITEM_HEIGHT]);

  const handleHourScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, 11)); // 0-11 (hours 1-12)
    setSelectedHour(clampedIndex + 1);

    // 정확한 위치로 스냅
    const targetY = clampedIndex * ITEM_HEIGHT;
    if (Math.abs(y - targetY) > 1) {
      hourScrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  }, [ITEM_HEIGHT]);

  const handleMinuteScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, 59)); // 0-59
    setSelectedMinute(clampedIndex);

    // 정확한 위치로 즉시 스냅
    const targetY = clampedIndex * ITEM_HEIGHT;
    if (Math.abs(y - targetY) > 1) {
      minuteScrollRef.current?.scrollTo({ y: targetY, animated: false });
    }
  }, [ITEM_HEIGHT]);

  const handleConfirm = () => {
    let hour24 = selectedHour;
    if (isPM) {
      hour24 = selectedHour === 12 ? 12 : selectedHour + 12;
    } else {
      hour24 = selectedHour === 12 ? 0 : selectedHour;
    }
    onConfirm(hour24, selectedMinute);
    onClose();
  };

  const renderPickerItems = (
    items: number[],
    formatFn: (n: number) => string,
    selectedValue: number
  ) => {
    const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

    return (
      <>
        {Array(paddingCount).fill(null).map((_, i) => (
          <View key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }} />
        ))}
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <View key={item} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text
                variant="body"
                style={{
                  fontSize: fs(22),
                  lineHeight: fs(28),
                  fontWeight: '600',
                  color: isSelected ? '#FFFFFF' : theme.colorMuted?.val,
                }}
              >
                {formatFn(item)}
              </Text>
            </View>
          );
        })}
        {Array(paddingCount).fill(null).map((_, i) => (
          <View key={`pad-bottom-${i}`} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }} />
        ))}
      </>
    );
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59

  const responsiveStyles = useMemo(() => ({
    sheetWrapper: {
      maxWidth: SHEET_MAX_WIDTH,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    container: {
      borderTopLeftRadius: radius(24),
      borderTopRightRadius: radius(24),
      paddingBottom: sp(32),
    },
    periodButton: {
      paddingHorizontal: sp(24),
      paddingVertical: sp(10),
      borderRadius: radius(8),
    },
    pickerContainer: {
      width: cs(80),
      height: PICKER_HEIGHT,
    },
    selectionIndicator: {
      top: ITEM_HEIGHT * 2,
      height: ITEM_HEIGHT,
      borderRadius: radius(12),
    },
    separator: {
      fontSize: fs(28),
    },
  }), [PICKER_HEIGHT, ITEM_HEIGHT]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn} style={styles.backdropOverlay} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.sheetContainer, responsiveStyles.sheetWrapper]}
      >
        <YStack
          style={[
            responsiveStyles.container,
            { backgroundColor: theme.surface?.val },
          ]}
        >
          {/* Handle */}
          <YStack ai="center" py="$4">
            <YStack
              width={40}
              height={4}
              borderRadius={2}
              style={{ backgroundColor: theme.borderColor?.val }}
            />
          </YStack>

          {/* Title */}
          <YStack ai="center" pb="$4">
            <Text variant="subheading" fontWeight="700">
              {t('notification.time')}
            </Text>
          </YStack>

          {/* AM/PM Toggle */}
          <XStack jc="center" pb="$5">
            <XStack
              style={{
                backgroundColor: theme.backgroundSoft?.val,
                borderRadius: radius(12),
                padding: 4,
              }}
            >
              <Pressable
                onPress={() => setIsPM(false)}
                style={[
                  responsiveStyles.periodButton,
                  !isPM && { backgroundColor: accent.primary },
                ]}
              >
                <Text
                  variant="body"
                  fontWeight="600"
                  style={{ color: !isPM ? '#FFFFFF' : theme.colorMuted?.val }}
                >
                  {t('notification.am')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsPM(true)}
                style={[
                  responsiveStyles.periodButton,
                  isPM && { backgroundColor: accent.primary },
                ]}
              >
                <Text
                  variant="body"
                  fontWeight="600"
                  style={{ color: isPM ? '#FFFFFF' : theme.colorMuted?.val }}
                >
                  {t('notification.pm')}
                </Text>
              </Pressable>
            </XStack>
          </XStack>

          {/* Time Picker Wheels */}
          <XStack jc="center" ai="center" gap="$2" px="$6">
            {/* Hour Picker */}
            <View style={[styles.pickerContainer, responsiveStyles.pickerContainer]}>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleHourScroll}
                contentContainerStyle={styles.pickerContent}
              >
                {renderPickerItems(hours, (n) => n.toString(), selectedHour)}
              </ScrollView>
              <View
                style={[
                  styles.selectionIndicator,
                  responsiveStyles.selectionIndicator,
                  { backgroundColor: accent.primary },
                ]}
                pointerEvents="none"
              />
            </View>

            {/* Separator */}
            <Text
              variant="heading"
              style={[responsiveStyles.separator, { fontWeight: '700', color: theme.color?.val }]}
            >
              :
            </Text>

            {/* Minute Picker */}
            <View style={[styles.pickerContainer, responsiveStyles.pickerContainer]}>
              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMinuteScroll}
                contentContainerStyle={styles.pickerContent}
              >
                {renderPickerItems(minutes, (n) => n.toString().padStart(2, '0'), selectedMinute)}
              </ScrollView>
              <View
                style={[
                  styles.selectionIndicator,
                  responsiveStyles.selectionIndicator,
                  { backgroundColor: accent.primary },
                ]}
                pointerEvents="none"
              />
            </View>
          </XStack>

          {/* Confirm Button */}
          <YStack px="$5" pt="$6">
            <Button label={t('notification.done')} onPress={handleConfirm} />
          </YStack>
        </YStack>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pickerContainer: {
    overflow: 'hidden',
  },
  pickerContent: {
    alignItems: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: -1,
  },
});
