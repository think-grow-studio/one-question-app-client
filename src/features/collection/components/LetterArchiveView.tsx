import { ScrollView, View } from 'react-native';
import { Text, YStack } from 'tamagui';
import { Letter } from '../types/api';
import { ViewMode } from '../types/store';
import { LetterRow } from './LetterRow';
import { CategoryFilter } from './CategoryFilter';
import { DateFilter } from './DateFilter';
import {
  groupLettersByCategory,
  groupLettersByDate,
  getUniqueCategories,
} from '../api/collectionApi';
import {
  filterLettersByCategory,
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
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAFAFA' }}>
      <Text size="$4" numberOfLines={2}>
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

  const renderByCategoryView = () => {
    const categories = getUniqueCategories();
    const grouped = groupLettersByCategory();

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
            <Text size="$4" color="$gray9">
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
                    borderBottomColor: '#F0F0F0',
                    borderBottomWidth: 1,
                  }}
                >
                  <Text size="$4" weight="600" style={{ marginBottom: 4 }}>
                    {letter.question}
                  </Text>
                  <Text size="$2" color="$gray10" style={{ marginBottom: 4 }}>
                    {letter.date}
                  </Text>
                  <Text size="$4" color="$gray8" numberOfLines={2}>
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
    let sorted = groupLettersByDate();

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
            <Text size="$4" color="$gray9">
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
                  borderBottomColor: '#F0F0F0',
                  borderBottomWidth: 1,
                }}
              >
                <Text size="$4" weight="600" style={{ marginBottom: 8 }}>
                  {letter.question}
                </Text>
                <Text size="$4" color="$gray8" numberOfLines={2}>
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
