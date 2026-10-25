/**
 * @akalin/barcode_module - Modül Fabrikası (createBarcodeModule.tsx)
 * @akalin/module_core ModuleRegistry ile tam uyumlu IModuleDefinition üretir.
 */

import React from 'react';
import { ScanBarcode, Printer, Barcode } from 'lucide-react';
import type { IModuleDefinition } from '@akalin/module_core';
import { CreateBarcodeModuleOptions } from './types';
import {
  createRestBarcodeAdapter,
  setGlobalBarcodeModuleConfig,
  BarcodeModuleProvider,
} from './adapters/BarcodeServiceContext';

import BarkodTerminaliPageComponent from './pages/BarkodTerminaliPage';
import SeriNoEtiketBasimPageComponent from './pages/SeriNoEtiketBasimPage';
import BarkodVeSeriNoTespitModalComponent from './components/BarkodVeSeriNoTespitModal';
import BarcodeScannerModalComponent from './components/BarcodeScannerModal';

export function createBarcodeModule(options?: CreateBarcodeModuleOptions): IModuleDefinition {
  const id = options?.id || 'barkod-yonetimi';
  const appName = options?.appName || 'Webakus ERP';
  const baseRoute = (options?.baseRoute || '/barkod').replace(/\/$/, '');
  const terminalRoute = options?.terminalRoute || '/barkod-terminali';
  const labelsRoute = options?.labelsRoute || '/barkod-etiket-basim';

  const adapter = options?.adapter || createRestBarcodeAdapter();

  setGlobalBarcodeModuleConfig({
    adapter,
    appName,
    baseRoute,
    terminalRoute,
    labelsRoute,
    onNotify: options?.onNotify,
  });

  const ConnectedBarkodTerminaliPage: React.FC<any> = (props) => (
    <BarcodeModuleProvider
      adapter={adapter}
      appName={appName}
      baseRoute={baseRoute}
      terminalRoute={terminalRoute}
      labelsRoute={labelsRoute}
      onNotify={options?.onNotify}
    >
      <BarkodTerminaliPageComponent {...props} baseRoute={terminalRoute} />
    </BarcodeModuleProvider>
  );

  const ConnectedSeriNoEtiketBasimPage: React.FC<any> = (props) => (
    <BarcodeModuleProvider
      adapter={adapter}
      appName={appName}
      baseRoute={baseRoute}
      terminalRoute={terminalRoute}
      labelsRoute={labelsRoute}
      onNotify={options?.onNotify}
    >
      <SeriNoEtiketBasimPageComponent {...props} baseRoute={labelsRoute} />
    </BarcodeModuleProvider>
  );

  return {
    id,
    title: 'Barkod Yönetimi',
    name: 'Barkod Yönetimi',
    description:
      'Barkod formatları, etiket basımı, kamera destekli el terminali ve donanım tarayıcı yönetimi.',
    version: '1.0.0',
    permissionPrefix: 'barcode',
    icon: React.createElement(ScanBarcode, { size: 20 }),
    iconName: 'ScanBarcode',
    order: options?.order ?? 70,
    isCore: true,
    defaultActive: true,
    routes: [
      {
        path: terminalRoute,
        element: React.createElement(ConnectedBarkodTerminaliPage),
        title: 'Barkod Terminali',
      },
      {
        path: labelsRoute,
        element: React.createElement(ConnectedSeriNoEtiketBasimPage),
        title: 'Etiket Basımı',
      },
      {
        path: '/araclar/etiket-basim',
        element: React.createElement(ConnectedSeriNoEtiketBasimPage),
        title: 'Etiket Basımı',
      },
    ],
    menuItems: [
      {
        id: 'barkod-terminali-menu',
        label: 'Barkod Terminali',
        path: terminalRoute,
        icon: React.createElement(ScanBarcode, { size: 20 }),
        order: 70,
      },
      {
        id: 'barkod-etiket-menu',
        label: 'Etiket Basımı',
        path: labelsRoute,
        icon: React.createElement(Printer, { size: 20 }),
        order: 71,
      },
    ],
    cards: [
      {
        id: 'barkod-terminali-karti',
        category: 'kart',
        titleKey: 'Barkod Terminali',
        route: terminalRoute,
      },
    ],
    operations: [
      {
        id: 'barkod-islem',
        category: 'islem',
        titleKey: 'Barkod ve Terminal İşlemleri',
        useStandardCrud: false,
        customActions: [
          {
            action: 'scan',
            labelKey: 'Kamera ve Terminal ile Tarama',
            description: 'Kamera veya fiziksel okuyucu ile barkod ve seri no okutma yetkisi.',
          },
          {
            action: 'print_labels',
            labelKey: 'Termal ve A4 Etiket Yazdırma',
            description: 'Ürün ve seri numaraları için etiket basımı gerçekleştirme yetkisi.',
          },
        ],
      },
    ],
    permissions: [
      {
        key: 'barcode.view',
        name: 'Barkod Terminalini Görüntüleme',
        description: 'Barkod terminali ve etiket basım sayfalarını görüntüleme yetkisi.',
        group: 'Barkod & Depo',
      },
      {
        key: 'barcode.scan',
        name: 'Barkod Tarama ve Fiş Eşleştirme',
        description: 'Barkod ve seri numaralarını tarayıp belgelere aktarma yetkisi.',
        group: 'Barkod & Depo',
      },
      {
        key: 'barcode.print',
        name: 'Etiket Basımı',
        description: 'Termal ve A4 barkod etiketlerini yazdırma yetkisi.',
        group: 'Barkod & Depo',
      },
    ],
    components: {
      BarkodTerminaliPage: BarkodTerminaliPageComponent,
      SeriNoEtiketBasimPage: SeriNoEtiketBasimPageComponent,
      BarkodVeSeriNoTespitModal: BarkodVeSeriNoTespitModalComponent,
      BarcodeScannerModal: BarcodeScannerModalComponent,
    },
    promotion: {
      title: 'Gelişmiş Barkod & Terminal Modülü',
      subtitle: 'Telefon veya tabletinizi anında profesyonel bir el terminaline dönüştürün.',
      description:
        'Kamera ve el tipi lazer okuyucularla tek tıkla depo giriş-çıkışlarını yapın, saniyeler içinde termal barkod etiketi basın.',
      icon: 'ScanBarcode',
      benefits: [
        'Kamera tabanlı çoklu lens ve hızlı barkod okuma desteği',
        'Zebra ve Honeywell standartlarında endüstriyel sesli bildirimler',
        'A4 ve 40x80mm termal rulo etiket yazıcıları ile tam uyum',
        'Mobil terminal ile masaüstü ekranlar arasında canlı SignalR/WebSocket eşleşmesi',
      ],
    },
  };
}

export const BarkodModule = createBarcodeModule();
export default BarkodModule;
