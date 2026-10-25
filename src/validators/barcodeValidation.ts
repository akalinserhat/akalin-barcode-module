/**
 * @akalin/barcode_module - Barkod Doğrulayıcılar (barcodeValidation.ts)
 */

/**
 * Gelen metnin genel barkod formatına uygun olup olmadığını denetler.
 * - Sadece harf, rakam ve tire/alt çizgi içermeli.
 * - Minimum 3, maksimum 50 karakter uzunluğunda olmalı.
 */
export const isValidBarcode = (barcode: string): boolean => {
  if (!barcode) return false;
  const trimmed = barcode.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    return false;
  }
  const barcodeRegex = /^[A-Za-z0-9\-_]+$/;
  return barcodeRegex.test(trimmed);
};

/**
 * Gelen değerin standart sayısal perakende barkod formatında (sadece rakam ve 8-14 haneli)
 * olup olmadığını kontrol eder (EAN-8, UPC-A, EAN-13, ITF-14).
 */
export const isBarkodFormat = (val: string): boolean => {
  if (!val) return false;
  return /^\d{8,14}$/.test(val.trim());
};

/**
 * Barkod formatı için detaylı hata ve geçerlilik çıktısı döner.
 */
export const validateBarcode = (barcode: string): { isValid: boolean; errorKey?: string } => {
  if (!barcode || !barcode.trim()) {
    return { isValid: false, errorKey: 'barkod_bos_olamaz' };
  }
  const trimmed = barcode.trim();
  if (trimmed.length < 3) {
    return { isValid: false, errorKey: 'barkod_cok_kisa' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, errorKey: 'barkod_cok_uzun' };
  }
  if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
    return { isValid: false, errorKey: 'barkod_gecersiz_karakter' };
  }
  return { isValid: true };
};
