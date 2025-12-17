import { Button, ButtonProps, styled } from 'tamagui';

interface ChipProps extends Omit<ButtonProps, 'children'> {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

const CHIP_BLUE = '#007AFF';
const CHIP_BLUE_PRESSED = '#0051D5';

const ChipButton = styled(Button, {
  name: 'QuestionChip',
  unstyled: true,
  width: '100%',
  height: 48,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '600',
  fontSize: 15,
  backgroundColor: '$gray5',
  color: '$color',
  borderWidth: 1,
  borderColor: '$gray6',
  pressStyle: {
    backgroundColor: '$gray4',
  },
  variants: {
    selected: {
      true: {
        backgroundColor: CHIP_BLUE,
        borderColor: CHIP_BLUE,
        color: '#FFFFFF',
        pressStyle: {
          backgroundColor: CHIP_BLUE_PRESSED,
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export function Chip({ label, selected = false, onPress, ...props }: ChipProps) {
  return (
    <ChipButton selected={selected} onPress={onPress} {...props}>
      {label}
    </ChipButton>
  );
}
