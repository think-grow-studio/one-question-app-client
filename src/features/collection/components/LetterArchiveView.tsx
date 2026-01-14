import { ScrollView, View } from 'react-native';
import { YStack, useTheme } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { Letter } from '../types/api';
import { ViewMode } from '../types/store';
import { LetterRow } from './LetterRow';
import { CategoryFilter } from './CategoryFilter';
import { DateFilter } from './DateFilter';
import {
  groupLettersByCategory,
  sortLettersByDate,
  getUniqueCategories,
  filterLettersByDateRange,
} from '../utils/collectionUtils';

interface LetterArchiveViewProps {
  letters: Letter[];
  viewMode: ViewMode;
  expandedLetterId: string | null;
  onToggleExpand: (id: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedStartDate: string | null;
  selectedEndDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
}

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.backgroundSoft?.val }}>
      <Text variant="body" numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

export function LetterArchiveView({
  letters,
  viewMode,
  expandedLetterId,
  onToggleExpand,
  selectedCategory,
  onSelectCategory,
  selectedStartDate,
  selectedEndDate,
  onStartDateChange,
  onEndDateChange,
}: LetterArchiveViewProps) {
  const theme = useTheme();

  const renderByCategoryView = () => {
    const categories = getUniqueCategories(letters);
    const grouped = groupLettersByCategory(letters);

    // Filter by selected category
    const filteredEntries = selectedCategory
      ? Object.entries(grouped).filter(([cat]) => cat === selectedCategory)
      : Object.entries(grouped);

    return (
      <View>
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />

        {/* Items */}
        {filteredEntries.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' }}>
            <Text variant="body" muted>
              해당 카테고리의 답변이 없어요
            </Text>
          </View>
        ) : (
          filteredEntries.map(([category, items]) => (
            <View key={category} style={{ marginBottom: 16 }}>
              {/* Category Header */}
              <SectionHeader title={category} />

              {/* Items */}
              {items.map((letter) => (
                <View
                  key={letter.id}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomColor: theme.borderColor?.val,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text variant="body" fontWeight="600" mb="$1">
                    {letter.question}
                  </Text>
                  <Text variant="caption" muted mb="$1">
                    {letter.date}
                  </Text>
                  <Text variant="body" muted numberOfLines={2}>
                    {letter.answer}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderByDateView = () => {
    let sorted = sortLettersByDate(letters);

    // Filter by date range
    sorted = filterLettersByDateRange(sorted, selectedStartDate, selectedEndDate);

    return (
      <View>
        {/* Date Filter */}
        <DateFilter
          startDate={selectedStartDate}
          endDate={selectedEndDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

        {/* Items */}
        {sorted.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' }}>
            <Text variant="body" muted>
              해당 기간의 답변이 없어요
            </Text>
          </View>
        ) : (
          sorted.map((letter) => (
            <View key={letter.id}>
              {/* Date Header */}
              <SectionHeader title={letter.date} />

              {/* Item */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomColor: theme.borderColor?.val,
                  borderBottomWidth: 1,
                }}
              >
                <Text variant="body" fontWeight="600" mb="$2">
                  {letter.question}
                </Text>
                <Text variant="body" muted numberOfLines={2}>
                  {letter.answer}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case '카테고리':
        return renderByCategoryView();
      case '날짜':
        return renderByDateView();
      default:
        return renderByCategoryView();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
        {/* Bottom padding */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
