import { Button as TamaguiButton, styled, GetProps } from 'tamagui';

const StyledButton = styled(TamaguiButton, {
  name: 'AppButton',
  width: '100%',
  height: 56,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: '600',
  fontSize: 17,
  borderWidth: 1.5,

  variants: {
    variant: {
      filled: {
        backgroundColor: '$primary',
        borderColor: '$primary',
        color: '#FFFFFF',
        pressStyle: {
          backgroundColor: '$primaryHover',
          borderColor: '$primaryHover',
        },
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: '$primary',
        color: '$primary',
        pressStyle: {
          backgroundColor: '$backgroundSoft',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: '$primary',
        pressStyle: {
          backgroundColor: '$backgroundSoft',
        },
      },
    },
    size: {
      small: {
        height: 40,
        fontSize: 14,
        borderRadius: 12,
      },
      medium: {
        height: 48,
        fontSize: 15,
        borderRadius: 14,
      },
      large: {
        height: 56,
        fontSize: 17,
        borderRadius: 16,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
      false: {
        width: 'auto',
        paddingHorizontal: '$4',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'filled',
    size: 'large',
    fullWidth: true,
  },
});

export type ButtonProps = GetProps<typeof StyledButton> & {
  label: string;
  enabled?: boolean;
};

export function Button({
  label,
  enabled = true,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      disabled={!enabled || disabled}
      opacity={!enabled || disabled ? 0.5 : 1}
      {...props}
    >
      {label}
    </StyledButton>
  );
}
