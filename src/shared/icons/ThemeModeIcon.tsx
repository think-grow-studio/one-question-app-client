import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface ThemeModeIconProps {
  size?: number;
  color?: string;
  mode: 'light' | 'dark';
}

export function ThemeModeIcon({ size = 24, color = '#000000', mode }: ThemeModeIconProps) {
  if (mode === 'light') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G clipPath="url(#clip0_light)">
          <Path
            d="M12.0001 17.8854C15.2504 17.8854 17.8854 15.2504 17.8854 12.0001C17.8854 8.74969 15.2504 6.11475 12.0001 6.11475C8.74969 6.11475 6.11475 8.74969 6.11475 12.0001C6.11475 15.2504 8.74969 17.8854 12.0001 17.8854Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2.7189 12.0059H1.5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M22.5003 12.0059H21.293"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12.0059 2.7189V1.5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12.0059 22.5V21.2927"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5.43521 5.43521L4.57617 4.57617"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19.4235 19.4237L18.5645 18.5647"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18.5645 5.43521L19.4235 4.57617"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4.57617 19.4237L5.43521 18.5647"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
        <Defs>
          <ClipPath id="clip0_light">
            <Rect width="24" height="24" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.1816 14.8608C20.6584 16.3802 19.7573 17.7415 18.5631 18.8168C17.3688 19.892 15.9207 20.6458 14.355 21.0072C12.7892 21.3687 11.1572 21.3259 9.61249 20.883C8.06779 20.44 6.66115 19.6114 5.52486 18.4751C4.38857 17.3389 3.55998 15.9322 3.11703 14.3875C2.67408 12.8428 2.63132 11.2108 2.99278 9.64505C3.35423 8.07927 4.10802 6.63116 5.18325 5.43693C6.25848 4.2427 7.6198 3.34159 9.13919 2.81836C9.32351 2.74848 9.52375 2.73176 9.71711 2.77011C9.91047 2.80846 10.0892 2.90032 10.2329 3.03525C10.3766 3.17019 10.4795 3.34276 10.53 3.53332C10.5804 3.72388 10.5763 3.92478 10.5182 4.11313C10.0135 5.61508 9.98407 7.23611 10.434 8.75537C10.7606 9.90012 11.3738 10.9427 12.2156 11.7844C13.0573 12.6262 14.0999 13.2394 15.2446 13.566C16.7639 14.0159 18.3849 13.9865 19.8869 13.4818C20.0752 13.4237 20.2761 13.4196 20.4667 13.47C20.6572 13.5205 20.8298 13.6234 20.9647 13.7671C21.0997 13.9108 21.1915 14.0895 21.2299 14.2829C21.2682 14.4762 21.2515 14.6765 21.1816 14.8608Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
