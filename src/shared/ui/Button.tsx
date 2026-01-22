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
  borderWidth: 1.5,

  // Tablet scaling (only stack-based properties)
  $gtSm: {
    height: 64,
    borderRadius: 18,
  },

  variants: {
    size: {
      small: {
        height: 40,
        borderRadius: 12,
        $gtSm: {
          height: 46,
          borderRadius: 14,
        },
      },
      medium: {
        height: 48,
        borderRadius: 14,
        $gtSm: {
          height: 54,
          borderRadius: 16,
        },
      },
      large: {
        height: 56,
        borderRadius: 16,
        $gtSm: {
          height: 64,
          borderRadius: 18,
        },
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
      false: {
        width: 'auto',
        paddingHorizontal: '$4',
        $gtSm: {
          paddingHorizontal: '$5',
        },
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
  size = 'large',
  ...props
}: ButtonProps) {
  const accent = useAccentColors();

  // Font size based on size variant
  const fontSizes: Record<string, number> = {
    small: 14,
    medium: 15,
    large: 17,
  };

  const sizeKey = typeof size === 'string' ? size : 'large';
  const fontSize = fontSizes[sizeKey] ?? 17;

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
      size={size}
      fontSize={fontSize}
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
