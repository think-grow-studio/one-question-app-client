import { Input as TamaguiInput, styled, GetProps, YStack } from 'tamagui';
import { Text } from './Text';

const StyledInput = styled(TamaguiInput, {
  name: 'AppInput',
  height: 48,
  borderRadius: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  backgroundColor: '$inputBackground',
  borderWidth: 1,
  borderColor: '$borderColor',
  color: '$color',
  placeholderTextColor: '$placeholderColor',

  focusStyle: {
    borderColor: '$borderColorFocus',
  },

  variants: {
    error: {
      true: {
        borderColor: '$red10',
        focusStyle: {
          borderColor: '$red10',
        },
      },
    },
    size: {
      small: {
        height: 40,
        fontSize: 14,
        borderRadius: 10,
      },
      medium: {
        height: 48,
        fontSize: 16,
        borderRadius: 12,
      },
      large: {
        height: 56,
        fontSize: 17,
        borderRadius: 14,
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
});

export type InputProps = GetProps<typeof StyledInput> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, ...props }: InputProps) {
  return (
    <YStack gap="$1.5">
      {label && <Text variant="label">{label}</Text>}
      <StyledInput error={!!error} {...props} />
      {error && (
        <Text variant="caption" color="$red10">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text variant="caption" muted>
          {helperText}
        </Text>
      )}
    </YStack>
  );
}
