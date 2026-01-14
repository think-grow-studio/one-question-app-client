import { Button, ButtonProps, styled } from 'tamagui';

interface ChipProps extends Omit<ButtonProps, 'children'> {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

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
  backgroundColor: '$backgroundSoft',
  color: '$color',
  borderWidth: 1,
  borderColor: '$borderColor',
  pressStyle: {
    backgroundColor: '$backgroundHover',
  },
  variants: {
    selected: {
      true: {
        backgroundColor: '$primary',
        borderColor: '$primary',
        color: '#FFFFFF',
        pressStyle: {
          backgroundColor: '$primaryHover',
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
