/**
 * @akalin/barcode_module - Seri No ve Barkod Etiket Basım Sayfası (SeriNoEtiketBasimPage.tsx)
 * Termal yazıcılar (40x80mm) ve standart A4 etiket sayfaları için QR kodlu ve barkodlu etiket basımı sağlar.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Printer, RefreshCw, Layout, Smartphone, Barcode, CheckSquare, Square } from 'lucide-react';
import QRCode from 'react-qr-code';
import { BaseCard } from '@akalin/ui';
import { useBarcodeModule } from '../adapters/BarcodeServiceContext';
import { SeriNoEtiketDTO } from '../types';

export interface SeriNoEtiketBasimPageProps {
  baseRoute?: string;
}

export const SeriNoEtiketBasimPage: React.FC<SeriNoEtiketBasimPageProps> = () => {
  const { t } = useTranslation();
  const { adapter, onNotify, appName } = useBarcodeModule();

  const [loading, setLoading] = useState(false);
  const [seriNolar, setSeriNolar] = useState<SeriNoEtiketDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const printRef = useRef<HTMLDivElement>(null);

  const notify = (type: 'success' | 'error' | 'info' | 'warning', msg: string) => {
    if (onNotify) {
      onNotify(type, msg);
    } else if (type === 'success') {
      toast.success(msg);
    } else {
      toast.error(msg);
    }
  };

  const fetchBekleyenler = async () => {
    try {
      setLoading(true);
      const data = await adapter.getPendingLabels();
      setSeriNolar(Array.isArray(data) ? data : []);
      setSelectedIds(data.map((s) => s.id));
    } catch (err: any) {
      notify('error', t('etiket_bekleyenler_yuklenemedi', 'Etiket bekleyen seri numaraları yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBekleyenler();
  }, [adapter]);

  const toggleSelection = (id: number | string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => String(x) !== String(id)));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === seriNolar.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(seriNolar.map((s) => s.id));
    }
  };

  const handlePrint = async () => {
    if (selectedIds.length === 0) {
      notify('warning', t('yazdirilacak_etiket_secmediniz', 'Yazdırılacak etiket seçmediniz.'));
      return;
    }

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      notify('error', t('popup_engellendi', 'Tarayıcınız yazdırma penceresini engelledi. Lütfen izin veriniz.'));
      return;
    }

    const thermalCss = `
      @page { size: 40mm 80mm; margin: 0; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .label-container { 
        width: 40mm; height: 80mm; box-sizing: border-box; padding: 4mm;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        page-break-after: always;
      }
      .label-container:last-child { page-break-after: auto; }
      .company-name { font-size: 10px; font-weight: bold; margin-bottom: 4px; text-align: center; }
      .product-name { font-size: 8px; text-align: center; margin-bottom: 8px; word-break: break-word; }
      .qr-wrapper { margin-bottom: 8px; }
      .serial-no { font-size: 10px; font-weight: bold; font-family: monospace; letter-spacing: 1px; }
    `;

    const a4Css = `
      @page { size: A4; margin: 10mm; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .a4-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5mm;
      }
      .label-container {
        border: 1px dashed #ccc;
        box-sizing: border-box;
        padding: 4mm;
        height: 45mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .company-name { font-size: 9px; font-weight: bold; margin-bottom: 2px; text-align: center; }
      .product-name { font-size: 8px; text-align: center; margin-bottom: 4px; word-break: break-word; max-height: 20px; overflow: hidden; }
      .qr-wrapper { margin-bottom: 4px; }
      .serial-no { font-size: 9px; font-weight: bold; font-family: monospace; }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('etiket_yazdir', 'Etiket Yazdır')}</title>
          <style>
            ${format === 'thermal' ? thermalCss : a4Css}
          </style>
        </head>
        <body>
          <div class="${format === 'a4' ? 'a4-grid' : ''}">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Etiket basıldı olarak işaretle
    try {
      await adapter.markLabelPrinted(selectedIds);
      notify('success', t('etiketler_basildi_olarak_isaretlendi', 'Seçili etiketler basıldı olarak güncellendi.'));
      fetchBekleyenler();
    } catch {
      notify('error', t('etiket_durumu_guncellenemedi', 'Etiket basıldı durumu güncellenirken hata oluştu.'));
    }
  };

  const selectedSerials = seriNolar.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Barcode size={26} className="text-primary" /> {t('etiket_basim_seri_nolar', 'Seri No & Barkod Etiket Basımı')}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('etiket_basim_aciklama', 'Etiket bekleyen ürün seri numaralarını seçip doğrudan termal veya A4 formatta yazdırabilirsiniz.')}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBekleyenler}
          disabled={loading}
          className="btn btn-secondary flex-row items-center gap-8"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>{t('yenile', 'Yenile')}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        {/* Sol Liste: Bekleyen Seri Numaraları */}
        <BaseCard variant="elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={toggleAll}
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                title={t('tumunu_sec_kaldir', 'Tümünü Seç / Kaldır')}
              >
                {selectedIds.length === seriNolar.length && seriNolar.length > 0 ? (
                  <CheckSquare size={22} color="var(--accent-primary)" />
                ) : (
                  <Square size={22} color="var(--text-secondary)" />
                )}
              </button>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {t('bekleyen_seri_nolar', 'Basım Bekleyen Seri Numaraları')} ({seriNolar.length})
              </h3>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="spin mb-12" />
              <p>{t('etiketler_yukleniyor', 'Etiketler yükleniyor...')}</p>
            </div>
          ) : seriNolar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Barcode size={44} style={{ margin: '0 auto 12px' }} />
              <p>{t('etiket_bekleyen_seri_yok', 'Şu anda etiket basımı bekleyen seri numarası bulunmuyor.')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
              {seriNolar.map((sn) => {
                const isSelected = selectedIds.includes(sn.id);
                return (
                  <div
                    key={sn.id}
                    onClick={() => toggleSelection(sn.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isSelected ? (
                        <CheckSquare size={18} color="var(--accent-primary)" />
                      ) : (
                        <Square size={18} color="var(--text-secondary)" />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{sn.urunVeHizmetKartiAdi}</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {sn.seriNo}
                        </div>
                      </div>
                    </div>
                    {sn.urunVeHizmetKartiKodu && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {sn.urunVeHizmetKartiKodu}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </BaseCard>

        {/* Sağ Panel: Basım Formatı ve Önizleme / Aksiyon */}
        <BaseCard variant="elevated" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            {t('basim_ayarlari', 'Basım Ayarları')}
          </h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn ${format === 'thermal' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              onClick={() => setFormat('thermal')}
            >
              <Smartphone size={20} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{t('termal_etiket', 'Termal Etiket')}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>40x80mm</span>
            </button>
            <button
              type="button"
              className={`btn ${format === 'a4' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              onClick={() => setFormat('a4')}
            >
              <Layout size={20} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{t('a4_sayfa', 'A4 Sayfa')}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{t('toplu_etiket', 'Toplu Etiket')}</span>
            </button>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {selectedIds.length}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('etiket_secildi', 'Etiket Basılmak Üzere Seçildi')}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full flex-row items-center justify-center gap-8"
            style={{ height: '48px', fontSize: '15px' }}
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
          >
            <Printer size={18} />
            <span>{t('yazdir', 'Yazdır')}</span>
          </button>
        </BaseCard>

        {/* Görünmez Önizleme / Baskı Havuzu */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {selectedSerials.map((sn) => (
              <div key={sn.id} className="label-container">
                <div className="company-name">{appName}</div>
                <div className="product-name">{sn.urunVeHizmetKartiAdi}</div>
                <div className="qr-wrapper">
                  <QRCode
                    value={sn.qrKodVerisi || sn.seriNo}
                    size={format === 'thermal' ? 90 : 70}
                    level="M"
                  />
                </div>
                <div className="serial-no">{sn.seriNo}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriNoEtiketBasimPage;
