import Svg, { Path } from 'react-native-svg';

interface SparkleIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

// 큰 별 + 작은 별 — "나를 만나는 시간" 탭 심볼.
const BIG_STAR =
  'M12 3C12 7 13 9.5 17 10C13 10.5 12 13 12 17C12 13 11 10.5 7 10C11 9.5 12 7 12 3Z';
const SMALL_STAR =
  'M18.5 14C18.5 15.8 19 16.7 21 17C19 17.3 18.5 18.2 18.5 20C18.5 18.2 18 17.3 16 17C18 16.7 18.5 15.8 18.5 14Z';

export function SparkleIcon({ size = 24, color = '#000000', active = false }: SparkleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={BIG_STAR}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? color : 'none'}
      />
      <Path
        d={SMALL_STAR}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? color : 'none'}
      />
    </Svg>
  );
}
