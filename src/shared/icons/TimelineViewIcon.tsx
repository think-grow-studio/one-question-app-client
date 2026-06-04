import Svg, { Rect } from 'react-native-svg';

interface TimelineViewIconProps {
  size?: number;
  color?: string;
}

/** 타임라인 뷰 아이콘 — 가로 막대 2개 */
export function TimelineViewIcon({ size = 22, color = '#000000' }: TimelineViewIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={4}
        width={18}
        height={5.5}
        rx={2}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Rect
        x={3}
        y={14.5}
        width={18}
        height={5.5}
        rx={2}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
    </Svg>
  );
}
