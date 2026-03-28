import { Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Get screen dimensions once at app start
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type (static)
export const IS_TABLET = Device.deviceType === Device.DeviceType.TABLET;

// Scale factors (static)
const SCALE_WIDTH = SCREEN_WIDTH / BASE_WIDTH;
const SCALE_HEIGHT = SCREEN_HEIGHT / BASE_HEIGHT;

// Horizontal scale - based on screen width
export function hs(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * SCALE_WIDTH));
}

// Vertical scale - based on screen height
export function vs(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * SCALE_HEIGHT));
}

// Moderate scale - balanced scaling with optional factor
// factor: 0 = no scaling, 1 = full horizontal scaling
export function ms(size: number, factor: number = 0.5): number {
  return Math.round(PixelRatio.roundToNearestPixel(size + (SCALE_WIDTH - 1) * size * factor));
}

// Font scale - with maximum scale limit for tablets
export function fs(size: number, maxScale: number = 1.3): number {
  const clampedScale = Math.min(SCALE_WIDTH, maxScale);
  return Math.round(PixelRatio.roundToNearestPixel(size * clampedScale));
}

// Spacing scale - for padding and margins
export function sp(size: number): number {
  return ms(size, 0.3);
}

// Border radius scale
export function radius(size: number): number {
  return ms(size, 0.25);
}

// Component size scale - for buttons, icons, etc.
export function cs(size: number): number {
  return ms(size, 0.4);
}

// Device-specific value helper (static)
export function deviceValue<T>(phone: T, tablet: T): T {
  return IS_TABLET ? tablet : phone;
}

// Screen constants
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// Sheet height standard constants
export const SHEET_HEIGHTS = {
  small: deviceValue(SCREEN_HEIGHT * 0.4, Math.min(SCREEN_HEIGHT * 0.35, 350)),
  medium: deviceValue(SCREEN_HEIGHT * 0.5, Math.min(SCREEN_HEIGHT * 0.45, 450)),
  large: deviceValue(SCREEN_HEIGHT * 0.7, Math.min(SCREEN_HEIGHT * 0.6, 600)),
  full: deviceValue(SCREEN_HEIGHT * 0.9, Math.min(SCREEN_HEIGHT * 0.8, 700)),
};

// Sheet max width (for centered layout on tablets)
export const SHEET_MAX_WIDTH = deviceValue(SCREEN_WIDTH, 600);
