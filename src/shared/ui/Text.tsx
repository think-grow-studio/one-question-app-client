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
        // Tablet scaling
        $gtSm: {
          fontSize: 28,
        },
      },
      subheading: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
        $gtSm: {
          fontSize: 23,
        },
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        $gtSm: {
          fontSize: 18,
          lineHeight: 28,
        },
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        $gtSm: {
          fontSize: 16,
          lineHeight: 24,
        },
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        color: '$colorMuted',
        $gtSm: {
          fontSize: 14,
        },
      },
      label: {
        fontSize: 14,
        fontWeight: '600',
        $gtSm: {
          fontSize: 16,
        },
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
