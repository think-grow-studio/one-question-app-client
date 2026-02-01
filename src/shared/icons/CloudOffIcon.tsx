import Svg, { Path, Line } from 'react-native-svg';

interface CloudOffIconProps {
  size?: number;
  color?: string;
}

export function CloudOffIcon({ size = 24, color = '#000000' }: CloudOffIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cloud shape */}
      <Path
        d="M6.5 19C4.567 19 3 17.433 3 15.5C3 13.883 4.064 12.525 5.5 12.123C5.5 9.515 7.515 7.5 10.123 7.5C11.395 7.5 12.534 8.042 13.332 8.915C13.869 8.633 14.478 8.5 15.123 8.5C17.195 8.5 18.876 10.181 18.876 12.253C20.109 12.558 21 13.686 21 15C21 16.657 19.657 18 18 18H6.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Diagonal slash line */}
      <Line
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
