export const CATEGORIES = [
  '일상',
  '관계',
  '성장',
  '취미',
  '여행',
  '음식',
  '영화',
  '음악',
  '책',
  '운동',
  '자기계발',
  '사랑',
] as const;

export type Category = typeof CATEGORIES[number];
