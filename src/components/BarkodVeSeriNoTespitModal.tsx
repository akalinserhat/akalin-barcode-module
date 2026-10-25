/**
 * @akalin/barcode_module - Barkod ve Seri No Tespit Modalı (BarkodVeSeriNoTespitModal.tsx)
 * Depo giriş ve çıkış işlemlerinde barkod okuyucu veya kamera ile kalemlerdeki ürünleri
 * ve seri numaralarını hızlıca okutup eşleştirmeyi sağlayan operasyon modalıdır.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle, Package, Scan, Barcode, Hash, X } from 'lucide-react';
import { BasePopup } from '@akalin/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useBarcodeModule } from '../adapters/BarcodeServiceContext';
import { useGlobalBarcodeScanner } from '../utils/useGlobalBarcodeScanner';
import { isBarkodFormat } from '../validators/barcodeValidation';
import { playSuccessBeep, playWarningBeep, playErrorBeep } from '../utils/scannerBeep';

export interface KalemItem {
  id: string | number;
  urunVeHizmetKartiId?: string | number;
  urunKodu?: string;
  urunAdi: string;
  barkod?: string;
  miktar: number | string;
  seriNolar?: string[];
}

export interface BarkodVeSeriNoTespitModalProps {
  isOpen: boolean;
  onClose: () => void;
  kalemler: KalemItem[];
  isGiris?: boolean;
  onSave: (groupedByKalem: Record<string, string[]>) => void;
}

interface RowItem {
  uuid: string;
  kalemId: string | number;
  urunId: string | number;
  urunKodu?: string;
  urunAdi: string;
  barkod?: string;
  seriNo: string;
}

export const BarkodVeSeriNoTespitModal: React.FC<BarkodVeSeriNoTespitModalProps> = ({
  isOpen,
  onClose,
  kalemler,
  isGiris = false,
  onSave,
}) => {
  const { t } = useTranslation();
  const { adapter, onNotify } = useBarcodeModule();

  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sonOkutulan, setSonOkutulan] = useState<{ urunAdi: string; seri: string } | null>(null);

  const [activeProductId, setActiveProductId] = useState<string | number | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | number | null>(null);

  const notify = (type: 'success' | 'error' | 'info' | 'warning', msg: string) => {
    if (onNotify) {
      onNotify(type, msg);
    } else if (type === 'success') {
      toast.success(msg);
    } else {
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (isOpen && kalemler) {
      const newRows: RowItem[] = [];
      kalemler.forEach((kalem) => {
        if (!kalem.urunVeHizmetKartiId) return;

        const miktar = parseInt(String(kalem.miktar)) || 0;
        const mevcutSeriler = kalem.seriNolar || [];

        for (let i = 0; i < miktar; i++) {
          newRows.push({
            uuid: Math.random().toString(36).substring(2, 9),
            kalemId: kalem.id,
            urunId: kalem.urunVeHizmetKartiId,
            urunKodu: kalem.urunKodu,
            urunAdi: kalem.urunAdi,
            barkod: kalem.barkod,
            seriNo: mevcutSeriler[i] || '',
          });
        }
      });
      setRows(newRows);
      setSonOkutulan(null);
      setActiveProductId(null);
      setHighlightedProductId(null);
    }
  }, [isOpen, kalemler, isGiris]);

  const updateRowSeriNo = (index: number, seri: string) => {
    const urunAdi = rows[index].urunAdi;
    const urunId = rows[index].urunId;

    setRows((prev) => {
      const newRows = [...prev];
      newRows[index].seriNo = seri;
      return newRows;
    });

    playSuccessBeep();
    setSonOkutulan({ urunAdi, seri });
    setHighlightedProductId(urunId);

    setTimeout(() => {
      setSonOkutulan(null);
    }, 3000);

    setTimeout(() => {
      setHighlightedProductId(null);
    }, 1500);
  };

  const handleGlobalScan = async (scannedValue: string) => {
    if (!isOpen || loading) return;
    const scanned = scannedValue.trim().toUpperCase();
    if (!scanned) return;

    if (isGiris) {
      // Depo Giriş İşlemi
      if (isBarkodFormat(scanned)) {
        const matchedRows = rows.filter((r) => r.barkod === scanned || r.urunKodu === scanned);
        if (matchedRows.length > 0) {
          setActiveProductId(matchedRows[0].urunId);
          playSuccessBeep();
          notify(
            'success',
            t('urun_secildi_seri_okutun', '{{ad}} seçildi, lütfen seri numarası okutunuz.', {
              ad: matchedRows[0].urunAdi,
            })
          );
          return;
        } else {
          try {
            const data = await adapter.queryProductByBarcode(scanned);
            if (data && data.length > 0) {
              const urunId = String(data[0].id);
              const urunMatchedRows = rows.filter((r) => String(r.urunId) === urunId);
              if (urunMatchedRows.length > 0) {
                setActiveProductId(urunId);
                playSuccessBeep();
                notify(
                  'success',
                  t('urun_secildi_seri_okutun', '{{ad}} seçildi, lütfen seri numarası okutunuz.', {
                    ad: urunMatchedRows[0].urunAdi,
                  })
                );
                return;
              }
            }
          } catch {}
          playWarningBeep();
          notify('error', t('barkod_fiste_bulunamadi', 'Okutulan barkod fişte bulunamadı.'));
          return;
        }
      } else {
        // Seri numarası girişi
        if (!activeProductId) {
          playWarningBeep();
          notify('error', t('once_barkod_okutun', 'Önce geçerli bir ürün barkodu okutmalısınız.'));
          return;
        }

        if (rows.some((r) => r.seriNo === scanned)) {
          playWarningBeep();
          notify('error', t('bu_seri_zaten_okutuldu', 'Bu seri numarası zaten okutuldu.'));
          return;
        }

        const targetRowIndex = rows.findIndex(
          (r) => String(r.urunId) === String(activeProductId) && !r.seriNo
        );
        if (targetRowIndex === -1) {
          playWarningBeep();
          notify('error', t('tum_seriler_girilmis', 'Bu ürüne ait tüm seri numaraları tamamlanmış.'));
          return;
        }

        updateRowSeriNo(targetRowIndex, scanned);
      }
    } else {
      // Depo Çıkış İşlemi
      let urunBulunduOlarakIsaretle = false;

      if (isBarkodFormat(scanned)) {
        const matchedRows = rows.filter((r) => r.barkod === scanned || r.urunKodu === scanned);
        if (matchedRows.length > 0) {
          setActiveProductId(matchedRows[0].urunId);
          playSuccessBeep();
          notify(
            'success',
            t('urun_secildi_seri_okutun', '{{ad}} seçildi, lütfen seri numarası okutunuz.', {
              ad: matchedRows[0].urunAdi,
            })
          );
          urunBulunduOlarakIsaretle = true;
        } else {
          try {
            const data = await adapter.queryProductByBarcode(scanned);
            if (data && data.length > 0) {
              const urunId = String(data[0].id);
              const urunMatchedRows = rows.filter((r) => String(r.urunId) === urunId);
              if (urunMatchedRows.length > 0) {
                setActiveProductId(urunId);
                playSuccessBeep();
                notify(
                  'success',
                  t('urun_secildi_seri_okutun', '{{ad}} seçildi, lütfen seri numarası okutunuz.', {
                    ad: urunMatchedRows[0].urunAdi,
                  })
                );
                urunBulunduOlarakIsaretle = true;
              }
            }
          } catch {}
        }
      }

      if (urunBulunduOlarakIsaretle) {
        return;
      }

      if (rows.some((r) => r.seriNo === scanned)) {
        playWarningBeep();
        notify('error', t('bu_seri_zaten_okutuldu', 'Bu seri numarası zaten okutuldu.'));
        return;
      }

      setLoading(true);
      try {
        const sorguSonucu = await adapter.querySerialNumber(scanned);

        if (
          sorguSonucu.durum === 'Satildi' ||
          sorguSonucu.durum === 'Kayip' ||
          sorguSonucu.durum === 'Hasarli'
        ) {
          playWarningBeep();
          notify(
            'warning',
            t('seri_durumu_uygun_degil', 'Uyarı: Seri numarasının durumu uygun değil ({{durum}}).', {
              durum: sorguSonucu.durum,
            })
          );
        }

        const targetRowIndex = rows.findIndex(
          (r) =>
            (r.urunKodu === sorguSonucu.urunVeHizmetKartiKodu ||
              r.urunAdi === sorguSonucu.urunVeHizmetKartiAdi) &&
            !r.seriNo
        );

        if (targetRowIndex === -1) {
          playWarningBeep();
          notify(
            'error',
            t(
              'urun_fiste_yok_veya_dolu',
              '"{{ad}}" ürünü fişte bulunmuyor veya tüm adetler doldurulmuş.',
              { ad: sorguSonucu.urunVeHizmetKartiAdi }
            )
          );
          return;
        }

        updateRowSeriNo(targetRowIndex, scanned);
        setActiveProductId(rows[targetRowIndex].urunId);
      } catch (err: any) {
        playErrorBeep();
        notify(
          'error',
          err?.message ||
            t('seri_sorgulanirken_hata', 'Seri numarası sorgulanırken hata oluştu veya kayıt bulunamadı.')
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGlobalScanRef = useRef(handleGlobalScan);
  useEffect(() => {
    handleGlobalScanRef.current = handleGlobalScan;
  }, [handleGlobalScan]);

  // Donanım Barkod Okuyucu Tuş Dinleyicisi
  useGlobalBarcodeScanner({
    isActive: isOpen,
    onScan: (val) => handleGlobalScanRef.current(val),
  });

  // Adapter Üzerinden Canlı Barkod Akışı (SignalR / WebSocket)
  useEffect(() => {
    if (!isOpen || !adapter.subscribeBarcode) return;
    const unsubscribe = adapter.subscribeBarcode((barcode: string) => {
      if (!isOpen) return;
      handleGlobalScanRef.current(barcode);
    });
    return () => {
      unsubscribe();
    };
  }, [isOpen, adapter]);

  const handleRemoveSeriNo = (index: number) => {
    setRows((prev) => {
      const newRows = [...prev];
      newRows[index].seriNo = '';
      return newRows;
    });
  };

  const handleSave = () => {
    const groupedByKalem: Record<string, string[]> = {};
    rows.forEach((r) => {
      const kId = String(r.kalemId);
      if (!groupedByKalem[kId]) {
        groupedByKalem[kId] = [];
      }
      if (r.seriNo) {
        groupedByKalem[kId].push(r.seriNo);
      }
    });

    onSave(groupedByKalem);
    onClose();
  };

  const dolular = rows.filter((r) => r.seriNo).length;
  const toplam = rows.length;

  const groupedProducts: any[] = [];
  rows.forEach((r, idx) => {
    let prod = groupedProducts.find((p) => String(p.urunId) === String(r.urunId));
    if (!prod) {
      prod = {
        urunId: r.urunId,
        urunKodu: r.urunKodu,
        urunAdi: r.urunAdi,
        barkod: r.barkod,
        toplam: 0,
        okutulan: 0,
        seriler: [],
      };
      groupedProducts.push(prod);
    }
    prod.toplam += 1;
    if (r.seriNo) {
      prod.okutulan += 1;
      prod.seriler.push({ seriNo: r.seriNo, rowIndex: idx });
    }
  });

  groupedProducts.sort((a, b) => {
    const aCompleted = a.okutulan === a.toplam;
    const bCompleted = b.okutulan === b.toplam;
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    if (String(a.urunId) === String(activeProductId)) return -1;
    if (String(b.urunId) === String(activeProductId)) return 1;
    return 0;
  });

  let statusText = t('barkod_veya_seri_okutun', 'Barkod veya Seri No Okutunuz');
  let statusColor = 'var(--text-secondary)';
  let StatusIcon = Scan;

  if (isGiris) {
    if (!activeProductId) {
      statusText = t('beklenen_once_barkod', 'Beklenen: Önce ürün barkodunu okutunuz.');
      statusColor = 'var(--accent-primary)';
      StatusIcon = Barcode;
    } else {
      statusText = t('beklenen_seri_no', 'Beklenen: Seçili ürün için seri numarası okutunuz.');
      statusColor = 'var(--warning)';
      StatusIcon = Hash;
    }
  } else {
    if (activeProductId) {
      statusText = t(
        'secili_icin_seri_veya_yeni',
        'Seçili ürün için seri no okutun veya yeni bir ürün barkodu taratın.'
      );
      statusColor = 'var(--warning)';
      StatusIcon = Scan;
    } else {
      statusText = t('beklenen_barkod_veya_seri', 'Beklenen: Barkod veya Seri Numarası okutunuz.');
      statusColor = 'var(--accent-primary)';
      StatusIcon = Scan;
    }
  }

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title={
        isGiris
          ? t('depo_giris_teslim_alma', 'Depo Giriş - Teslim Alma')
          : t('depo_cikis_teslim_etme', 'Depo Çıkış - Teslim Etme')
      }
      modalSize="xl"
      hideMaximize
      hideFooter
    >
      <div className="barcode-modal-body">
        <div
          className="barcode-header"
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: statusColor,
              fontWeight: '600',
              fontSize: '15px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: `1px solid ${statusColor}`,
              }}
            >
              <StatusIcon size={20} />
            </div>
            {statusText}
            {loading && (
              <span className="ml-2 text-xs opacity-70">{t('sorgulaniyor', 'Sorgulanıyor...')}</span>
            )}
          </div>

          <div className="barcode-success-badge-wrapper" style={{ margin: 0, height: 'auto' }}>
            {sonOkutulan && (
              <div
                className="barcode-success-badge"
                style={{ padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle size={16} />
                {sonOkutulan.urunAdi} - {sonOkutulan.seri}
              </div>
            )}
          </div>
        </div>

        <div className="barcode-content">
          <div className="barcode-progress-container" style={{ padding: '0 24px 16px' }}>
            <div
              className="barcode-progress-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <h3
                className="barcode-progress-title"
                style={{
                  margin: 0,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Package size={18} />
                {t('operasyon_ilerlemesi', 'Operasyon İlerlemesi')}
              </h3>
              <div
                className="barcode-progress-count"
                style={{
                  fontWeight: '600',
                  color: dolular === toplam ? 'var(--success)' : 'var(--text-primary)',
                }}
              >
                {dolular} / {toplam} {t('adet_urun', 'Ürün')}
              </div>
            </div>
            <div
              className="barcode-progress-bar-bg"
              style={{
                height: '8px',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              <div
                className="barcode-progress-bar-fill"
                style={{
                  height: '100%',
                  width: `${toplam > 0 ? (dolular / toplam) * 100 : 0}%`,
                  background: dolular === toplam ? 'var(--success)' : 'var(--accent-primary)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div className="barcode-modal-content" style={{ padding: '0 24px' }}>
            {groupedProducts.length === 0 ? (
              <div
                className="barcode-empty-state"
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Package size={48} style={{ margin: '0 auto 12px' }} />
                <p>{t('seri_no_gerektiren_urun_yok', 'Seri numarası girişi gerektiren ürün bulunamadı.')}</p>
              </div>
            ) : (
              <div
                className="barcode-product-list"
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {groupedProducts.map((p) => {
                  const isTamamlandi = p.okutulan === p.toplam;
                  const isSelected = String(activeProductId) === String(p.urunId);
                  const isHighlighted = String(highlightedProductId) === String(p.urunId);

                  return (
                    <div
                      key={p.urunId}
                      onClick={() => setActiveProductId(p.urunId)}
                      className={`barcode-product-card ${isTamamlandi ? 'completed' : ''} ${
                        isSelected ? 'selected' : ''
                      } ${isHighlighted ? 'highlight' : ''}`}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--glass-border)',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        className="barcode-product-header"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <div className="barcode-product-title">
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{p.urunAdi}</h4>
                          <div
                            className="barcode-product-meta"
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              gap: '12px',
                            }}
                          >
                            {p.urunKodu && <span>{t('kod', 'Kod')}: {p.urunKodu}</span>}
                            {p.barkod && <span>{t('barkod', 'Barkod')}: {p.barkod}</span>}
                          </div>
                        </div>
                        <div
                          className={`barcode-product-count ${
                            isTamamlandi ? 'badge-success' : 'badge-primary'
                          }`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '13px',
                            background: isTamamlandi
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                            color: isTamamlandi ? 'var(--success)' : 'var(--accent-primary)',
                          }}
                        >
                          {p.okutulan} / {p.toplam}
                        </div>
                      </div>

                      <div
                        className="barcode-product-progress"
                        style={{
                          height: '6px',
                          borderRadius: '3px',
                          background: 'var(--bg-secondary)',
                          marginBottom: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="barcode-product-progress-fill"
                          style={{
                            height: '100%',
                            width: `${(p.okutulan / p.toplam) * 100}%`,
                            background: isTamamlandi ? 'var(--success)' : 'var(--accent-primary)',
                          }}
                        />
                      </div>

                      <div
                        className="barcode-product-serials"
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                      >
                        {p.seriler.map((s: any) => (
                          <div
                            key={s.seriNo}
                            className="barcode-serial-badge"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-secondary)',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: '600',
                              border: '1px solid var(--glass-border)',
                            }}
                          >
                            <Check size={14} color="var(--success)" />
                            {s.seriNo}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSeriNo(s.rowIndex);
                              }}
                              className="barcode-serial-remove hover:bg-red-50"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {p.seriler.length === 0 && (
                          <span
                            className="barcode-serial-empty"
                            style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                          >
                            {t('henuz_seri_okutulmadi', 'Henüz bu ürüne ait seri numarası okutulmadı.')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="barcode-modal-footer"
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--glass-border)',
            marginTop: '16px',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-outline">
            {t('iptal', 'İptal')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary flex-row items-center gap-8"
          >
            <Check size={18} />
            {t('kaydet', 'Kaydet')}
          </button>
        </div>
      </div>
    </BasePopup>
  );
};

export default BarkodVeSeriNoTespitModal;
