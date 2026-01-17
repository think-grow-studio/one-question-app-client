import { Button as TamaguiButton, styled, GetProps } from 'tamagui';
import { useAccentColors } from '@/shared/theme';

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
    size: 'large',
    fullWidth: true,
  },
});

type ButtonVariant = 'filled' | 'outlined' | 'ghost';

export type ButtonProps = Omit<GetProps<typeof StyledButton>, 'variant'> & {
  label: string;
  enabled?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  label,
  enabled = true,
  disabled,
  variant = 'filled',
  ...props
}: ButtonProps) {
  const accent = useAccentColors();

  const variantStyles = {
    filled: {
      backgroundColor: accent.primary,
      borderColor: accent.primary,
      color: accent.textOnPrimary,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: accent.primary,
      color: accent.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: accent.primary,
    },
  };

  return (
    <StyledButton
      disabled={!enabled || disabled}
      opacity={!enabled || disabled ? 0.5 : 1}
      {...variantStyles[variant]}
      pressStyle={{
        backgroundColor: variant === 'filled' ? accent.primaryHover : '$backgroundSoft',
        borderColor: variant === 'filled' ? accent.primaryHover : variantStyles[variant].borderColor,
      }}
      {...props}
    >
      {label}
    </StyledButton>
  );
}
