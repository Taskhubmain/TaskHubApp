import { Capacitor } from '@capacitor/core';

export function isNativeMobile(): boolean {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  console.log('[Platform] isNativeMobile check:', {
    isNative,
    platform,
    userAgent: navigator.userAgent
  });
  return isNative;
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
