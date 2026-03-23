import Svg, { Path } from 'react-native-svg';

interface FeedIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export function FeedIcon({ size = 24, color = '#000000', active = false }: FeedIconProps) {
  if (active) {
    // Filled people/community icon
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 20C17 18.3431 14.7614 17 12 17C9.23858 17 7 18.3431 7 20"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
        />
        <Path
          d="M21 20C21 18.7865 19.8662 17.7555 18.2 17.3"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M18 14C19.1046 14 20 12.8807 20 11.5C20 10.1193 19.1046 9 18 9"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M3 20C3 18.7865 4.13383 17.7555 5.8 17.3"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M6 14C4.89543 14 4 12.8807 4 11.5C4 10.1193 4.89543 9 6 9"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // Outline people/community icon
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 20C17 18.3431 14.7614 17 12 17C9.23858 17 7 18.3431 7 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M21 20C21 18.7865 19.8662 17.7555 18.2 17.3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M18 14C19.1046 14 20 12.8807 20 11.5C20 10.1193 19.1046 9 18 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M3 20C3 18.7865 4.13383 17.7555 5.8 17.3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M6 14C4.89543 14 4 12.8807 4 11.5C4 10.1193 4.89543 9 6 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
