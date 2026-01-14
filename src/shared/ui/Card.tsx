import { YStack, styled, GetProps } from 'tamagui';

const StyledCard = styled(YStack, {
  name: 'AppCard',
  backgroundColor: '$surface',
  borderRadius: 16,
  padding: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',

  variants: {
    elevated: {
      true: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 0,
      },
    },
    padding: {
      none: { padding: 0 },
      small: { padding: '$2' },
      medium: { padding: '$4' },
      large: { padding: '$6' },
    },
    radius: {
      small: { borderRadius: 12 },
      medium: { borderRadius: 16 },
      large: { borderRadius: 24 },
    },
  } as const,

  defaultVariants: {
    padding: 'medium',
    radius: 'medium',
  },
});

export type CardProps = GetProps<typeof StyledCard>;

export function Card(props: CardProps) {
  return <StyledCard {...props} />;
}
