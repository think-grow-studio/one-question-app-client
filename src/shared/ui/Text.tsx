import { Text as TamaguiText, styled, GetProps } from 'tamagui';

const StyledText = styled(TamaguiText, {
  name: 'AppText',
  color: '$color',

  variants: {
    variant: {
      heading: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      subheading: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        color: '$colorMuted',
      },
      label: {
        fontSize: 14,
        fontWeight: '600',
      },
    },
    muted: {
      true: {
        color: '$colorMuted',
      },
    },
    subtle: {
      true: {
        color: '$colorSubtle',
      },
    },
    center: {
      true: {
        textAlign: 'center',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'body',
  },
});

export type TextProps = GetProps<typeof StyledText>;

export function Text(props: TextProps) {
  return <StyledText {...props} />;
}
