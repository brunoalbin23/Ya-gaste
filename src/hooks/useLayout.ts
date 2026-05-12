import { Platform, useWindowDimensions } from 'react-native';

const DESKTOP_BREAKPOINT = 768;

export interface LayoutInfo {
  isMobile: boolean;
  isWebMobile: boolean;
  isDesktop: boolean;
}

export function useLayout(): LayoutInfo {
  const { width } = useWindowDimensions();
  const isNative = Platform.OS !== 'web';
  const isDesktop = !isNative && width >= DESKTOP_BREAKPOINT;
  const isWebMobile = !isNative && width < DESKTOP_BREAKPOINT;
  const isMobile = isNative || isWebMobile;
  return { isMobile, isWebMobile, isDesktop };
}
