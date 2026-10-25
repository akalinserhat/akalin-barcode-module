/**
 * @akalin/barcode_module - Global Donanım Barkod Okuyucu Hook'u (useGlobalBarcodeScanner.ts)
 * USB veya Bluetooth klavye modunda çalışan tüm fiziksel barkod okuyucuların
 * tuş vuruşlarını yüksek hızla tamponlar ve 'Enter' anında tek seferde yakalar.
 */

import { useEffect, useRef } from 'react';
import { isValidBarcode } from '../validators/barcodeValidation';

export interface UseGlobalBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  isActive?: boolean;
  timeout?: number; // İki tuş basımı arası azami bekleme süresi (ms). Barkod okuyucular 10-30ms hızında yazar.
}

export const useGlobalBarcodeScanner = ({
  onScan,
  isActive = true,
  timeout = 50,
}: UseGlobalBarcodeScannerOptions) => {
  const keys = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());
  const originalInputValues = useRef<Map<HTMLInputElement, string>>(new Map());

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Eğer tuş basımı yavaşsa (insan elle yazıyorsa) tamponu sıfırla
      if (timeDiff > timeout) {
        keys.current = '';
        originalInputValues.current.clear();
      }

      lastKeyTime.current = currentTime;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // İlk tuş anında bir input içindeysek, input'un orijinal değerini saklayalım
      if (keys.current.length === 0 && isInput) {
        const inputEl = target as HTMLInputElement;
        if (!originalInputValues.current.has(inputEl)) {
          originalInputValues.current.set(inputEl, inputEl.value || '');
        }
      }

      // Enter basıldı ve tampon doluysa
      if (e.key === 'Enter') {
        if (keys.current.length > 0) {
          const scanned = keys.current;
          keys.current = '';

          if (isValidBarcode(scanned)) {
            e.preventDefault();
            e.stopPropagation();

            // İstenmeden input alanına yazılan barkod karakterlerini geri al
            if (isInput) {
              const inputEl = target as HTMLInputElement;
              const origValue = originalInputValues.current.get(inputEl);
              if (origValue !== undefined && inputEl.value.endsWith(scanned)) {
                inputEl.value = origValue;
              }
            }

            onScan(scanned);
          }
        }
        originalInputValues.current.clear();
        return;
      }

      // Sadece tekil karakterleri ekle
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        keys.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, isActive, timeout]);
};

export default useGlobalBarcodeScanner;
