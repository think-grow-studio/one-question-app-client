import Svg, { Rect, Path } from 'react-native-svg';

interface MailIconProps {
  size?: number;
  color?: string;
}

export function MailIcon({ size = 24, color = '#000000' }: MailIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2.68159"
        y="3.5"
        width="18.5"
        height="17"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M2.72875 7.58978L9.93399 11.7198C10.5383 12.0709 11.2238 12.2557 11.9216 12.2557C12.6195 12.2557 13.305 12.0709 13.9093 11.7198L21.1344 7.58978"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
