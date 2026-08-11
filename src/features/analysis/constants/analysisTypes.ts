import type { ImageSourcePropType } from 'react-native';
import type { AnalysisType } from '../types/api';

/** 분석에 필요한 답변 개수 경계 */
export const MIN_ANSWERS = 10;
export const MAX_ANSWERS = 15;

/**
 * 분석 종류별 표시 메타데이터.
 * 카피(제목/설명/섹션)는 i18n 키로 분리 — analysis 네임스페이스 참조.
 * emoji 는 카드/결과 헤더 공용 심볼.
 */
export interface AnalysisTypeMeta {
  type: AnalysisType;
  emoji: string;
  /** 카드/시트/결과 헤더 공용 캐릭터 이미지 (이모지 대체) */
  image: ImageSourcePropType;
  /** i18n: analysis:types.<key>.* */
  i18nKey: 'thinkingPattern' | 'warmReflection';
}

export const ANALYSIS_TYPES: AnalysisTypeMeta[] = [
  {
    type: 'THINKING_PATTERN',
    emoji: '🧠',
    image: require('@/assets/images/nickname-character/fox.png'),
    i18nKey: 'thinkingPattern',
  },
  {
    type: 'WARM_REFLECTION',
    emoji: '💌',
    image: require('@/assets/images/nickname-character/koala.png'),
    i18nKey: 'warmReflection',
  },
];

export const ANALYSIS_TYPE_META: Record<AnalysisType, AnalysisTypeMeta> = {
  THINKING_PATTERN: ANALYSIS_TYPES[0],
  WARM_REFLECTION: ANALYSIS_TYPES[1],
};

export function isAnalysisType(value: string | undefined): value is AnalysisType {
  return value === 'THINKING_PATTERN' || value === 'WARM_REFLECTION';
}

/**
 * 빅카드 컬러 워시 팔레트 — 종류별 고유 hue (테마 액센트와 무관).
 * 사고 패턴 = 차분한 쿨톤(분석적), 따듯한 위로 = 따스한 웜톤(공감).
 * 라이트/다크 각각 정의해 가독성 보장.
 * surface = 단색 배경(그라데이션 클리셰 제거), gradient = 빅카드 그라데이션 버전 복귀용으로 보존.
 */
export interface CardPalette {
  surface: string;
  gradient: [string, string];
  badgeBg: string;
  pill: string;
  pillText: string;
}

const CARD_PALETTES: Record<AnalysisType, { light: CardPalette; dark: CardPalette }> = {
  THINKING_PATTERN: {
    light: { surface: '#ECF1FD', gradient: ['#E9F0FE', '#F1F0FD'], badgeBg: '#FFFFFF', pill: '#3F6FE0', pillText: '#FFFFFF' },
    dark: { surface: '#222C45', gradient: ['#212F49', '#241F40'], badgeBg: '#32415C', pill: '#4F74D6', pillText: '#FFFFFF' },
  },
  WARM_REFLECTION: {
    light: { surface: '#FBEBE9', gradient: ['#FCEEE6', '#FBE8EC'], badgeBg: '#FFFFFF', pill: '#DB7350', pillText: '#FFFFFF' },
    dark: { surface: '#312220', gradient: ['#322620', '#2F1D22'], badgeBg: '#48342A', pill: '#C8694A', pillText: '#FFFFFF' },
  },
};

export function getCardPalette(type: AnalysisType, dark: boolean): CardPalette {
  return dark ? CARD_PALETTES[type].dark : CARD_PALETTES[type].light;
}
