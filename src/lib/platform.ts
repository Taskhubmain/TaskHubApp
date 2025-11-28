import { Capacitor } from '@capacitor/core';

export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'web' | 'android' | 'ios' {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';

  return 'web';
}
