import { Modal, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { YStack, XStack, Paragraph } from 'tamagui';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { useHistoryStore } from '../stores/useHistoryStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DatePickerSheet() {
  const { isDatePickerVisible, setIsDatePickerVisible, history, currentDate, setCurrentDate } =
    useHistoryStore();

  const handleClose = () => {
    setIsDatePickerVisible(false);
  };

  const handleSelectDate = (date: string) => {
    setCurrentDate(date);
    handleClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return {
      date: `${month}월 ${day}일`,
      weekday: `${weekday}요일`,
      year,
    };
  };

  if (!isDatePickerVisible) return null;

  return (
    <Modal transparent visible={isDatePickerVisible} animationType="none">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View entering={FadeIn} style={styles.backdropOverlay} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(200)}
        style={styles.sheetContainer}
      >
        <YStack bg={colors.cardWhite} borderTopLeftRadius={24} borderTopRightRadius={24} pb="$8">
          {/* Handle */}
          <YStack ai="center" py="$4">
            <YStack width={40} height={4} bg={colors.systemGray4} borderRadius={2} />
          </YStack>

          {/* Header */}
          <YStack px="$5" pb="$4">
            <Paragraph fontSize={22} fontWeight="700" letterSpacing={-0.3}>
              날짜 선택
            </Paragraph>
          </YStack>

          {/* Date List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <YStack gap="$3" px="$5">
              {history.map((item) => {
                const { date, weekday, year } = formatDate(item.date);
                const isSelected = item.date === currentDate;

                return (
                  <Pressable key={item.date} onPress={() => handleSelectDate(item.date)}>
                    <XStack
                      ai="center"
                      jc="space-between"
                      p={20}
                      borderRadius={16}
                      bg={isSelected ? colors.systemBlue : colors.cardWhite}
                      borderWidth={1}
                      borderColor={isSelected ? colors.systemBlue : colors.systemGray5}
                      style={styles.dateItem}
                    >
                      <YStack gap="$2" flex={1}>
                        <XStack ai="center" gap="$2">
                          <Paragraph
                            fontSize={18}
                            fontWeight="700"
                            color={isSelected ? colors.white : colors.textPrimary}
                            letterSpacing={-0.3}
                          >
                            {date}
                          </Paragraph>
                          <Paragraph
                            fontSize={15}
                            fontWeight="600"
                            color={isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
                            letterSpacing={-0.2}
                          >
                            {weekday}
                          </Paragraph>
                        </XStack>
                        <Paragraph
                          fontSize={14}
                          color={isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
                          letterSpacing={-0.1}
                          numberOfLines={1}
                        >
                          {item.question.length > 30
                            ? item.question.slice(0, 30) + '...'
                            : item.question}
                        </Paragraph>
                      </YStack>

                      {item.answer && (
                        <Paragraph fontSize={22} color={isSelected ? colors.white : colors.systemBlue}>
                          ✓
                        </Paragraph>
                      )}
                    </XStack>
                  </Pressable>
                );
              })}
            </YStack>
          </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  dateItem: {
  },
});
