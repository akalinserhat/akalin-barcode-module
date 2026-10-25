/**
 * @akalin/barcode_module - Ana Giriş Noktası (index.ts)
 * Bağımsız Barkod Yönetimi, Etiket Basımı ve Barkod Terminali Modülü
 */

// Tipler
export * from './types';

// Varsayılan Veriler
export * from './defaults/defaultBarcodes';

// Doğrulayıcılar
export * from './validators/barcodeValidation';

// Yardımcı Araçlar & Kancalar (Utils & Hooks)
export * from './utils/scannerBeep';
export * from './utils/useGlobalBarcodeScanner';
export * from './utils/networkSender';
export * from './utils/device';

// Adaptörler & Context
export * from './adapters/BarcodeServiceContext';

// Bileşenler
export { default as BarkodVeSeriNoTespitModal } from './components/BarkodVeSeriNoTespitModal';
export type { BarkodVeSeriNoTespitModalProps, KalemItem } from './components/BarkodVeSeriNoTespitModal';
export { default as BarcodeScannerModal } from './components/BarcodeScannerModal';
export type { BarcodeScannerModalProps } from './components/BarcodeScannerModal';
export { default as BarkodTerminaliAyarlar } from './components/BarkodTerminaliAyarlar';
export type { BarkodTerminaliAyarlarProps } from './components/BarkodTerminaliAyarlar';

// Sayfalar
export { default as BarkodTerminaliPage } from './pages/BarkodTerminaliPage';
export type { BarkodTerminaliPageProps } from './pages/BarkodTerminaliPage';
export { default as SeriNoEtiketBasimPage } from './pages/SeriNoEtiketBasimPage';
export type { SeriNoEtiketBasimPageProps } from './pages/SeriNoEtiketBasimPage';

// Modül Tanımı ve Fabrikası
export { createBarcodeModule, BarkodModule, BarkodModule as BarkodTerminaliModule, BarkodModule as BarkodYonetimiModule } from './createBarcodeModule';
export { default } from './createBarcodeModule';
