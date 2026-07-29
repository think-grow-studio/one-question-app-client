import { Switch } from 'react-native';
import { useTheme } from 'tamagui';
import { useAccentColors } from '@/shared/theme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * 앱 공용 토글 스위치.
 *
 * thumb 색은 그 아래 깔리는 트랙에 따라 갈라진다 — 켜짐이면 accent.primary 위라
 * accent.textOnPrimary, 꺼짐이면 회색 트랙 위라 흰색.
 * thumb를 흰색으로 하드코딩하면 화이트 액센트 + 다크모드에서 primary가 #FFFFFF라
 * 켜짐 상태가 통짜 흰 덩어리가 되고, 반대로 항상 textOnPrimary를 쓰면 같은 조합의
 * 꺼짐 상태에서 thumb(#2D3436)가 borderColor(#38383A)에 묻힌다.
 */
export function AppSwitch({ value, onValueChange, disabled }: AppSwitchProps) {
  const theme = useTheme();
  const accent = useAccentColors();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: theme.borderColor?.val,
        true: accent.primary,
      }}
      thumbColor={value ? accent.textOnPrimary : '#FFFFFF'}
      ios_backgroundColor={theme.borderColor?.val}
    />
  );
}
