import Svg, { Path, Circle } from 'react-native-svg';

interface GlobeIconProps {
  size?: number;
  color?: string;
}

export function GlobeIcon({ size = 24, color = '#000000' }: GlobeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M3.5 9H20.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M3.5 15H20.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 3C12 3 8 7.5 8 12C8 16.5 12 21 12 21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 3C12 3 16 7.5 16 12C16 16.5 12 21 12 21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
