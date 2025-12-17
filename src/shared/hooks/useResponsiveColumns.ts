import { useWindowDimensions } from 'react-native';

interface ResponsiveColumnsOptions {
  breakpoint?: number;
  smallColumns?: number;
  largeColumns?: number;
}

export function useResponsiveColumns({
  breakpoint = 420,
  smallColumns = 2,
  largeColumns = 3,
}: ResponsiveColumnsOptions = {}) {
  const { width } = useWindowDimensions();
  return width >= breakpoint ? largeColumns : smallColumns;
}
