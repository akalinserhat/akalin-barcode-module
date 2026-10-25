/**
 * @akalin/barcode_module - Varsayılan ve Örnek Veriler (defaultBarcodes.ts)
 */

import { SeriNoEtiketDTO, BarkodUrunSorguDTO, SeriNoSorguDTO } from '../types';

export const DEFAULT_SAMPLE_PENDING_LABELS: SeriNoEtiketDTO[] = [
  {
    id: 1,
    seriNo: 'SN-2026-9812401',
    urunVeHizmetKartiId: 101,
    urunVeHizmetKartiKodu: 'URN-001',
    urunVeHizmetKartiAdi: 'Bosch SMS44DW00T Bulaşık Makinesi',
    etiketBasildiMi: false,
    qrKodVerisi: 'SN-2026-9812401',
    olusturulmaTarihi: new Date().toISOString(),
  },
  {
    id: 2,
    seriNo: 'SN-2026-9812402',
    urunVeHizmetKartiId: 101,
    urunVeHizmetKartiKodu: 'URN-001',
    urunVeHizmetKartiAdi: 'Bosch SMS44DW00T Bulaşık Makinesi',
    etiketBasildiMi: false,
    qrKodVerisi: 'SN-2026-9812402',
    olusturulmaTarihi: new Date().toISOString(),
  },
  {
    id: 3,
    seriNo: 'SN-2026-1120933',
    urunVeHizmetKartiId: 102,
    urunVeHizmetKartiKodu: 'URN-002',
    urunVeHizmetKartiAdi: 'Samsung 55Q70C 4K QLED Televizyon',
    etiketBasildiMi: false,
    qrKodVerisi: 'SN-2026-1120933',
    olusturulmaTarihi: new Date().toISOString(),
  },
  {
    id: 4,
    seriNo: 'SN-2026-4409121',
    urunVeHizmetKartiId: 103,
    urunVeHizmetKartiKodu: 'URN-003',
    urunVeHizmetKartiAdi: 'Dyson V15 Detect Kablosuz Süpürge',
    etiketBasildiMi: false,
    qrKodVerisi: 'SN-2026-4409121',
    olusturulmaTarihi: new Date().toISOString(),
  },
];

export const DEFAULT_SAMPLE_PRODUCTS: BarkodUrunSorguDTO[] = [
  {
    id: 101,
    barkod: '8690123456789',
    kod: 'URN-001',
    ad: 'Bosch SMS44DW00T Bulaşık Makinesi',
    birim: 'Adet',
    fiyat: 24500,
    aktifMi: true,
  },
  {
    id: 102,
    barkod: '8690987654321',
    kod: 'URN-002',
    ad: 'Samsung 55Q70C 4K QLED Televizyon',
    birim: 'Adet',
    fiyat: 48900,
    aktifMi: true,
  },
  {
    id: 103,
    barkod: '8690555666777',
    kod: 'URN-003',
    ad: 'Dyson V15 Detect Kablosuz Süpürge',
    birim: 'Adet',
    fiyat: 32900,
    aktifMi: true,
  },
];

export const DEFAULT_SAMPLE_SERIALS: SeriNoSorguDTO[] = [
  {
    id: 1,
    seriNo: 'SN-2026-9812401',
    urunVeHizmetKartiId: 101,
    urunVeHizmetKartiKodu: 'URN-001',
    urunVeHizmetKartiAdi: 'Bosch SMS44DW00T Bulaşık Makinesi',
    durum: 'Stokta',
  },
  {
    id: 2,
    seriNo: 'SN-2026-1120933',
    urunVeHizmetKartiId: 102,
    urunVeHizmetKartiKodu: 'URN-002',
    urunVeHizmetKartiAdi: 'Samsung 55Q70C 4K QLED Televizyon',
    durum: 'Stokta',
  },
];
