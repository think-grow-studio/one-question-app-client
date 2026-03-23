import Svg, { Path } from 'react-native-svg';

interface BackIconProps {
  size?: number;
  color?: string;
}

export function BackIcon({ size = 24, color = '#000000' }: BackIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
