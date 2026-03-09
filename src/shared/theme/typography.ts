// 기본값: 시스템 폰트 (fontFamily 미지정)
// 커스텀 폰트 적용 시 이 파일만 수정하면 됨
//
// 예시 (Pretendard):
// export const fontFamily = {
//   regular: 'Pretendard-Regular',
//   medium: 'Pretendard-Medium',
//   semiBold: 'Pretendard-SemiBold',
//   bold: 'Pretendard-Bold',
// };

export const fontFamily = {
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
  semiBold: undefined as string | undefined,
  bold: undefined as string | undefined,
};

type FontWeight = '400' | '500' | '600' | '700' | 'bold';

type FontStyle = {
  fontFamily?: string;
  fontWeight?: FontWeight;
};

/** fontWeight → fontFamily 매핑 헬퍼 */
export function getFontStyle(weight: FontWeight): FontStyle {
  const map: Record<FontWeight, FontStyle> = {
    '400': {
      fontFamily: fontFamily.regular,
      fontWeight: fontFamily.regular ? undefined : '400',
    },
    '500': {
      fontFamily: fontFamily.medium,
      fontWeight: fontFamily.medium ? undefined : '500',
    },
    '600': {
      fontFamily: fontFamily.semiBold,
      fontWeight: fontFamily.semiBold ? undefined : '600',
    },
    '700': {
      fontFamily: fontFamily.bold,
      fontWeight: fontFamily.bold ? undefined : '700',
    },
    bold: {
      fontFamily: fontFamily.bold,
      fontWeight: fontFamily.bold ? undefined : 'bold',
    },
  };
  return map[weight];
}
