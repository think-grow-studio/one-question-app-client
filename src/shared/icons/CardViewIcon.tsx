import Svg, { Rect } from 'react-native-svg';

interface CardViewIconProps {
  size?: number;
  color?: string;
}

/** 카드 뷰 아이콘 — 단일 세로 라운드 사각형 */
export function CardViewIcon({ size = 22, color = '#000000' }: CardViewIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={4}
        y={3}
        width={16}
        height={18}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
    </Svg>
  );
}
