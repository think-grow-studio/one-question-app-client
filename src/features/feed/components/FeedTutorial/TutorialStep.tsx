import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { YStack } from 'tamagui';
import { Text } from '@/shared/ui/Text';
import { getFontStyle } from '@/shared/theme/typography';
import { fs, sp } from '@/shared/utils/responsive';

interface TutorialStepProps {
  pageWidth: number;
  pageHeight: number;
  title: string;
  description: string;
  disclaimer?: string;
  children: ReactNode;
}

export function TutorialStep({
  pageWidth,
  pageHeight,
  title,
  description,
  disclaimer,
  children,
}: TutorialStepProps) {
  return (
    <View style={[styles.page, { width: pageWidth, height: pageHeight }]}>
      <View style={styles.mockArea}>{children}</View>
      <YStack gap={sp(8)} alignItems="center" paddingHorizontal={sp(8)} paddingTop={sp(20)}>
        <Text style={styles.title} {...getFontStyle('700')}>
          {title}
        </Text>
        <Text muted style={styles.description}>
          {description}
        </Text>
        {disclaimer ? (
          <Text subtle style={styles.disclaimer}>
            {disclaimer}
          </Text>
        ) : null}
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: sp(20),
    paddingTop: sp(8),
    paddingBottom: sp(16),
  },
  mockArea: {
    // flex:1 을 제거해 빈 공간을 차지하지 않도록 함 → 콘텐츠가 페이지 상단부터
    // 자연스럽게 쌓이고 남는 공간은 하단에 빈자리로 남는다. 작은 mock (날짜) 도
    // 너무 빈약해 보이지 않게 minHeight 로 최소 높이 확보.
    minHeight: sp(140),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fs(18),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  description: {
    fontSize: fs(14),
    lineHeight: fs(21),
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: fs(11),
    lineHeight: fs(16),
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: sp(4),
  },
});
