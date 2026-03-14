import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isCompact = width < 600;
  const isMedium = width >= 600 && width < 900;
  const isExpanded = width >= 900;

  return {
    width,
    height,
    isCompact,
    isMedium,
    isExpanded,
    isTwoPane: width >= 820,
    screenPadding: isExpanded ? 24 : isMedium ? 20 : 12,
    maxContentWidth: isExpanded ? 1120 : isMedium ? 920 : 680,
    productColumns: width >= 1080 ? 3 : width >= 700 ? 2 : 1,
    adminColumns: width >= 920 ? 2 : 1,
    statColumns: width >= 1100 ? 4 : width >= 700 ? 2 : 1,
    stackedInputs: width < 460,
    tabLabelPosition: width >= 700 ? 'beside-icon' : 'below-icon'
  };
}
