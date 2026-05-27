import { StyleSheet, Text as RNText, View } from 'react-native';
import { getFontStyle } from '@/shared/theme/typography';
import { useAccentColors } from '@/shared/theme';
import { cs, fs, radius } from '@/shared/utils/responsive';

export function MockIntro() {
  const accent = useAccentColors();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: `${accent.primary}1A`,
            borderColor: accent.primary,
          },
        ]}
      >
        {/* 공유 Tamagui Text 의 body variant 가 lineHeight:24 를 강제하므로 큰 글자가
            line box 위로 잘리는 이슈가 있다. 큰 글자 한 글자만 그리는 경우엔 RN Text
            를 직접 써서 variant 상속을 우회한다. */}
        <RNText
          allowFontScaling={false}
          style={[styles.badgeText, { color: accent.primary }, getFontStyle('700')]}
        >
          Q.
        </RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: cs(96),
    height: cs(96),
    borderRadius: radius(48),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Android: Text 가 includeFontPadding 으로 위/아래 여백을 더 잡아 큰 글자가
    // badge 원 안에서 정렬이 어긋나는 걸 방지하기 위해 컨테이너에 약간의 padding.
    paddingTop: 2,
  },
  badgeText: {
    fontSize: fs(38),
    lineHeight: fs(46),
    letterSpacing: -0.5,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
