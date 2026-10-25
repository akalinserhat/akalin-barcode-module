/**
 * @akalin/barcode_module - Cihaz ve Platform Algılama (device.ts)
 */

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!((window as any).Capacitor?.isNativePlatform?.() || (window as any)._isNative);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

export const isMobileBrowser = (): boolean => {
  return isMobileDevice() && !isNativePlatform();
};
