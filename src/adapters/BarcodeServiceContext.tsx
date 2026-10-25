/**
 * @akalin/barcode_module - Servis Adaptörleri ve React Context (BarcodeServiceContext.tsx)
 * REST ve LocalStorage adaptörleri ile monolitik bağımlılıkları tamamen soyutlar.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  IBarcodeServiceAdapter,
  SeriNoEtiketDTO,
  BarkodUrunSorguDTO,
  SeriNoSorguDTO,
  TerminalUserDTO,
  SendResultDTO,
} from '../types';
import {
  DEFAULT_SAMPLE_PENDING_LABELS,
  DEFAULT_SAMPLE_PRODUCTS,
  DEFAULT_SAMPLE_SERIALS,
} from '../defaults/defaultBarcodes';
import { sendBarcodeToTarget } from '../utils/networkSender';

/**
 * 1) REST Tabanlı Standart Adaptör (Webakus API uyumlu)
 */
export function createRestBarcodeAdapter(options?: {
  apiPrefix?: string;
  customHeaders?: Record<string, string> | (() => Record<string, string>);
  customFetch?: typeof fetch;
  signalRBridge?: {
    subscribeBarcode?: (callback: (code: string) => void) => () => void;
    subscribeScannerState?: (callback: (state: string, productName: string) => void) => () => void;
    sendBarcodeToConnection?: (connId: string, code: string) => Promise<any>;
  };
}): IBarcodeServiceAdapter {
  const doFetch = options?.customFetch || fetch;

  const getHeaders = (extra?: Record<string, string>) => {
    let headers: Record<string, string> = {
      Accept: 'application/json',
      ...(extra || {}),
    };
    if (options?.customHeaders) {
      const custom =
        typeof options.customHeaders === 'function'
          ? options.customHeaders()
          : options.customHeaders;
      headers = { ...headers, ...custom };
    }
    return headers;
  };

  const handleJson = async (res: Response) => {
    if (!res.ok) {
      let errText = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.message || errJson.mesaj || JSON.stringify(errJson);
      } catch {
        try {
          errText = await res.text();
        } catch {}
      }
      throw new Error(errText);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  };

  return {
    async getPendingLabels(): Promise<SeriNoEtiketDTO[]> {
      const res = await doFetch('/api/UrunVeHizmetSeriNolari/etiket-bekleyenler', {
        headers: getHeaders(),
      });
      return (await handleJson(res)) || [];
    },

    async markLabelPrinted(ids: Array<number | string>): Promise<void> {
      const res = await doFetch('/api/UrunVeHizmetSeriNolari/etiket-basildi', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids }),
      });
      await handleJson(res);
    },

    async queryProductByBarcode(barcode: string): Promise<BarkodUrunSorguDTO[]> {
      const res = await doFetch(
        `/api/UrunVeHizmetKartlari?barkod=${encodeURIComponent(barcode)}&aktifMi=true`,
        { headers: getHeaders() }
      );
      const data = await handleJson(res);
      return Array.isArray(data) ? data : data?.veriler || [];
    },

    async querySerialNumber(serialNo: string): Promise<SeriNoSorguDTO> {
      const res = await doFetch(
        `/api/UrunVeHizmetSeriNolari/sorgula/${encodeURIComponent(serialNo)}`,
        { headers: getHeaders() }
      );
      return await handleJson(res);
    },

    async getActiveTerminalUsers(): Promise<TerminalUserDTO[]> {
      try {
        const res = await doFetch('/api/BarkodTerminali/aktif-cihazlar', {
          headers: getHeaders(),
        });
        const data = await handleJson(res);
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },

    async sendBarcodeToConnection(connId: string, barcode: string): Promise<SendResultDTO> {
      if (options?.signalRBridge?.sendBarcodeToConnection) {
        try {
          await options.signalRBridge.sendBarcodeToConnection(connId, barcode);
          return { success: true, message: 'Barkod hedefe iletildi.' };
        } catch (err: any) {
          return { success: false, message: err?.message || 'İletim hatası' };
        }
      }
      return { success: false, message: 'SignalR köprüsü tanımlı değil.' };
    },

    async sendBarcodeToNetwork(url: string, barcode: string): Promise<SendResultDTO> {
      return await sendBarcodeToTarget(url, barcode);
    },

    subscribeBarcode(callback: (barcode: string) => void): () => void {
      if (options?.signalRBridge?.subscribeBarcode) {
        return options.signalRBridge.subscribeBarcode(callback);
      }
      return () => {};
    },

    subscribeScannerState(callback: (state: string, productName: string) => void): () => void {
      if (options?.signalRBridge?.subscribeScannerState) {
        return options.signalRBridge.subscribeScannerState(callback);
      }
      return () => {};
    },
  };
}

/**
 * 2) LocalStorage / Mock Bellek Tabanlı Adaptör
 */
export function createLocalStorageBarcodeAdapter(options?: {
  initialLabels?: SeriNoEtiketDTO[];
  initialProducts?: BarkodUrunSorguDTO[];
  initialSerials?: SeriNoSorguDTO[];
}): IBarcodeServiceAdapter {
  let labels: SeriNoEtiketDTO[] = options?.initialLabels || [...DEFAULT_SAMPLE_PENDING_LABELS];
  let products: BarkodUrunSorguDTO[] = options?.initialProducts || [...DEFAULT_SAMPLE_PRODUCTS];
  let serials: SeriNoSorguDTO[] = options?.initialSerials || [...DEFAULT_SAMPLE_SERIALS];

  const barcodeListeners: Array<(barcode: string) => void> = [];
  const stateListeners: Array<(state: string, productName: string) => void> = [];

  return {
    async getPendingLabels(): Promise<SeriNoEtiketDTO[]> {
      return JSON.parse(JSON.stringify(labels.filter((l) => !l.etiketBasildiMi)));
    },

    async markLabelPrinted(ids: Array<number | string>): Promise<void> {
      const idSet = new Set(ids.map(String));
      labels = labels.map((l) => (idSet.has(String(l.id)) ? { ...l, etiketBasildiMi: true } : l));
    },

    async queryProductByBarcode(barcode: string): Promise<BarkodUrunSorguDTO[]> {
      const found = products.filter(
        (p) => p.barkod === barcode || p.kod.toLowerCase() === barcode.toLowerCase()
      );
      return JSON.parse(JSON.stringify(found));
    },

    async querySerialNumber(serialNo: string): Promise<SeriNoSorguDTO> {
      const found = serials.find((s) => s.seriNo.toLowerCase() === serialNo.toLowerCase());
      if (!found) {
        throw new Error('Seri numarası bulunamadı.');
      }
      return JSON.parse(JSON.stringify(found));
    },

    async getActiveTerminalUsers(): Promise<TerminalUserDTO[]> {
      return [
        {
          connectionId: 'demo-conn-1',
          cihazAdi: 'Depo El Terminali #1',
          kullaniciAdi: 'Depo Sorumlusu',
          baglantiTarihi: new Date().toLocaleTimeString(),
        },
      ];
    },

    async sendBarcodeToConnection(connId: string, barcode: string): Promise<SendResultDTO> {
      barcodeListeners.forEach((fn) => fn(barcode));
      return { success: true, message: `Barkod (${barcode}) simülasyon ortamında iletildi.` };
    },

    async sendBarcodeToNetwork(url: string, barcode: string): Promise<SendResultDTO> {
      return await sendBarcodeToTarget(url, barcode);
    },

    subscribeBarcode(callback: (barcode: string) => void): () => void {
      barcodeListeners.push(callback);
      return () => {
        const idx = barcodeListeners.indexOf(callback);
        if (idx !== -1) barcodeListeners.splice(idx, 1);
      };
    },

    subscribeScannerState(callback: (state: string, productName: string) => void): () => void {
      stateListeners.push(callback);
      return () => {
        const idx = stateListeners.indexOf(callback);
        if (idx !== -1) stateListeners.splice(idx, 1);
      };
    },
  };
}

/**
 * 3) Barcode Module Context & Provider
 */
export interface BarcodeModuleContextValue {
  adapter: IBarcodeServiceAdapter;
  appName: string;
  baseRoute: string;
  terminalRoute: string;
  labelsRoute: string;
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const BarcodeModuleContext = createContext<BarcodeModuleContextValue | null>(null);

let globalBarcodeModuleConfig: BarcodeModuleContextValue | null = null;

export function setGlobalBarcodeModuleConfig(config: BarcodeModuleContextValue) {
  globalBarcodeModuleConfig = config;
}

export function getGlobalBarcodeModuleConfig(): BarcodeModuleContextValue | null {
  return globalBarcodeModuleConfig;
}

export interface BarcodeModuleProviderProps {
  adapter?: IBarcodeServiceAdapter;
  appName?: string;
  baseRoute?: string;
  terminalRoute?: string;
  labelsRoute?: string;
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  children: ReactNode;
}

export const BarcodeModuleProvider: React.FC<BarcodeModuleProviderProps> = ({
  adapter,
  appName = 'Webakus ERP',
  baseRoute = '/barkod',
  terminalRoute = '/barkod-terminali',
  labelsRoute = '/barkod-etiket-basim',
  onNotify,
  children,
}) => {
  const activeAdapter = adapter || globalBarcodeModuleConfig?.adapter || createRestBarcodeAdapter();

  const value: BarcodeModuleContextValue = {
    adapter: activeAdapter,
    appName,
    baseRoute,
    terminalRoute,
    labelsRoute,
    onNotify: onNotify || globalBarcodeModuleConfig?.onNotify,
  };

  return (
    <BarcodeModuleContext.Provider value={value}>{children}</BarcodeModuleContext.Provider>
  );
};

export function useBarcodeModule(): BarcodeModuleContextValue {
  const ctx = useContext(BarcodeModuleContext);
  if (ctx) return ctx;
  if (globalBarcodeModuleConfig) return globalBarcodeModuleConfig;

  return {
    adapter: createRestBarcodeAdapter(),
    appName: 'Webakus ERP',
    baseRoute: '/barkod',
    terminalRoute: '/barkod-terminali',
    labelsRoute: '/barkod-etiket-basim',
  };
}
