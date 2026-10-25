/**
 * @akalin/barcode_module - Tip Tanımları (types.ts)
 */

export interface SeriNoEtiketDTO {
  id: number | string;
  seriNo: string;
  urunVeHizmetKartiId?: number | string;
  urunVeHizmetKartiKodu?: string;
  urunVeHizmetKartiAdi: string;
  etiketBasildiMi?: boolean;
  qrKodVerisi?: string;
  olusturulmaTarihi?: string;
}

export interface BarkodUrunSorguDTO {
  id: number | string;
  barkod?: string;
  kod: string;
  ad: string;
  birim?: string;
  fiyat?: number;
  aktifMi?: boolean;
}

export interface SeriNoSorguDTO {
  id: number | string;
  seriNo: string;
  urunVeHizmetKartiId?: number | string;
  urunVeHizmetKartiKodu?: string;
  urunVeHizmetKartiAdi: string;
  durum?: 'Stokta' | 'Satildi' | 'Kayip' | 'Hasarli' | string;
}

export interface TerminalUserDTO {
  connectionId: string;
  kullaniciAdi?: string;
  cihazAdi?: string;
  baglantiTarihi?: string;
  ipAdresi?: string;
}

export interface SendResultDTO {
  success: boolean;
  message: string;
}

export interface IBarcodeServiceAdapter {
  getPendingLabels(): Promise<SeriNoEtiketDTO[]>;
  markLabelPrinted(ids: Array<number | string>): Promise<void>;
  queryProductByBarcode(barcode: string): Promise<BarkodUrunSorguDTO[]>;
  querySerialNumber(serialNo: string): Promise<SeriNoSorguDTO>;
  getActiveTerminalUsers?(): Promise<TerminalUserDTO[]>;
  sendBarcodeToConnection?(connectionId: string, barcode: string): Promise<SendResultDTO>;
  sendBarcodeToNetwork?(url: string, barcode: string): Promise<SendResultDTO>;
  subscribeBarcode?(callback: (barcode: string) => void): () => void;
  subscribeScannerState?(callback: (state: string, productName: string) => void): () => void;
}

export interface CreateBarcodeModuleOptions {
  id?: string;
  appName?: string;
  baseRoute?: string;
  terminalRoute?: string;
  labelsRoute?: string;
  adapter?: IBarcodeServiceAdapter;
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  order?: number;
}
