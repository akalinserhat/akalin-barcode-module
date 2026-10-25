/**
 * @akalin/barcode_module - Barkod Terminali Sayfası (BarkodTerminaliPage.tsx)
 * Kamera, ZXing tarayıcı, hedef bilgisayar eşleştirmesi ve endüstriyel ses bildirimleri içerir.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Settings,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  RefreshCw,
  Monitor,
  Smartphone,
  ScanBarcode,
  ArrowLeft,
  Video,
} from 'lucide-react';
import { useBarcodeModule } from '../adapters/BarcodeServiceContext';
import { BarkodTerminaliAyarlar } from '../components/BarkodTerminaliAyarlar';
import { playSuccessBeep, playWarningBeep, playErrorBeep } from '../utils/scannerBeep';
import { isMobileDevice } from '../utils/device';
import { TerminalUserDTO } from '../types';

export interface BarkodTerminaliPageProps {
  isLocalMode?: boolean;
  onLocalScan?: (code: string) => boolean | void | Promise<boolean | void>;
  onCloseLocal?: () => void;
  localScannerState?: 'WAITING_BARCODE' | 'WAITING_SERIAL';
  localScannerProductName?: string;
  baseRoute?: string;
}

export const BarkodTerminaliPage: React.FC<BarkodTerminaliPageProps> = ({
  isLocalMode = false,
  onLocalScan,
  onCloseLocal,
  localScannerState,
  localScannerProductName,
  baseRoute = '/barkod-terminali',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { adapter, onNotify } = useBarcodeModule();

  const [activeTab, setActiveTab] = useState<'scanner' | 'settings'>('scanner');
  const [targetConnectionId, setTargetConnectionId] = useState('');
  const [targetName, setTargetName] = useState('');

  const [activeUsers, setActiveUsers] = useState<TerminalUserDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [lastStatus, setLastStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const [advancedMode, setAdvancedMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('barkod_advanced_mode');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [autoConnect, setAutoConnect] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barkod_auto_connect') === 'true';
    } catch {
      return false;
    }
  });

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    try {
      return localStorage.getItem('barkod_selected_camera') || '';
    } catch {
      return '';
    }
  });

  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const zxingVideoRef = useRef<HTMLVideoElement>(null);

  const [scannerState, setScannerState] = useState<'WAITING_BARCODE' | 'WAITING_SERIAL'>('WAITING_BARCODE');
  const [scannerProductName, setScannerProductName] = useState('');

  const effectiveScannerState = isLocalMode && localScannerState ? localScannerState : scannerState;
  const effectiveScannerProductName =
    isLocalMode && localScannerProductName !== undefined ? localScannerProductName : scannerProductName;

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
    if (adapter.subscribeScannerState) {
      const unsubscribe = adapter.subscribeScannerState((state, prodName) => {
        setScannerState(state as any);
        setScannerProductName(prodName);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [adapter]);

  useEffect(() => {
    if (advancedMode && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          return BrowserMultiFormatReader.listVideoInputDevices();
        })
        .then((videoInputDevices) => {
          setCameras(videoInputDevices);
          if (videoInputDevices.length > 0 && !selectedCameraId) {
            setSelectedCameraId(videoInputDevices[0].deviceId);
            try {
              localStorage.setItem('barkod_selected_camera', videoInputDevices[0].deviceId);
            } catch {}
          }
        })
        .catch(() => {
          notify('error', t('kamera_erisim_hatasi', 'Kameralara erişilemedi. Lütfen kamera izinlerini kontrol ediniz.'));
        });
    }
  }, [advancedMode]);

  const fetchActiveUsers = async () => {
    setLoadingUsers(true);
    try {
      if (adapter.getActiveTerminalUsers) {
        const users = await adapter.getActiveTerminalUsers();
        setActiveUsers(users);
        return users;
      }
    } catch (err) {
      notify('error', t('aktif_kullanicilar_yuklenemedi', 'Aktif kullanıcılar yüklenemedi.'));
    } finally {
      setLoadingUsers(false);
    }
    return [];
  };

  useEffect(() => {
    fetchActiveUsers().then((users) => {
      try {
        const savedConnId = localStorage.getItem('barkod_target_conn_id');
        const savedName = localStorage.getItem('barkod_target_name');
        if (savedConnId && savedName && users && users.some((u) => u.connectionId === savedConnId)) {
          setTargetConnectionId(savedConnId);
          setTargetName(savedName);
        }
      } catch {}
    });
  }, [adapter]);

  const selectTarget = (connId: string, name?: string) => {
    setTargetConnectionId(connId);
    setTargetName(name || connId);
    try {
      localStorage.setItem('barkod_target_conn_id', connId);
      localStorage.setItem('barkod_target_name', name || connId);
    } catch {}
    notify('success', t('baglanti_saglandi_cihaz', 'Cihaz seçildi: {{name}}', { name: name || connId }));
    setActiveTab('scanner');
  };

  const disconnectTarget = () => {
    setTargetConnectionId('');
    setTargetName('');
    try {
      localStorage.removeItem('barkod_target_conn_id');
      localStorage.removeItem('barkod_target_name');
    } catch {}
    notify('info', t('baglanti_kesildi', 'Bağlantı kesildi.'));
  };

  const handleAdvancedModeChange = (enabled: boolean) => {
    setAdvancedMode(enabled);
    try {
      localStorage.setItem('barkod_advanced_mode', enabled.toString());
    } catch {}
    if (!enabled) {
      stopCustomScan();
    }
  };

  const handleAutoConnectChange = (checked: boolean) => {
    setAutoConnect(checked);
    try {
      localStorage.setItem('barkod_auto_connect', checked.toString());
    } catch {}
  };

  const handleCameraSelect = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem('barkod_selected_camera', deviceId);
    } catch {}
    if (isScanning) {
      stopCustomScan();
      setTimeout(() => startCustomScan(deviceId), 300);
    }
  };

  const startCustomScan = async (overrideDeviceId?: string) => {
    const deviceId = overrideDeviceId || selectedCameraId || undefined;
    const codeReader = new BrowserMultiFormatReader();

    try {
      if (!zxingVideoRef.current) return;
      setIsScanning(true);

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        zxingVideoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            handleScanned(scannedText);
          }
        }
      );
      zxingControlsRef.current = controls;
    } catch (err: any) {
      console.error('Kamera başlatılamadı:', err);
      setIsScanning(false);
      playErrorBeep();
      notify('error', t('kamera_baslatilamadi', 'Kamera başlatılamadı: {{err}}', { err: err?.message || '' }));
    }
  };

  const stopCustomScan = () => {
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleScan = () => {
    if (isScanning) {
      stopCustomScan();
    } else {
      startCustomScan();
    }
  };

  const handleScanned = async (code: string) => {
    setLastScanned(code);
    setLastStatus('sending');

    if (isLocalMode && onLocalScan) {
      const shouldClose = await onLocalScan(code);
      if (shouldClose === false) {
        playWarningBeep();
        setLastStatus('error');
      } else {
        playSuccessBeep();
        setLastStatus('success');
        setTimeout(() => {
          stopCustomScan();
          if (onCloseLocal) onCloseLocal();
        }, 500);
      }
      return;
    }

    if (!targetConnectionId) {
      playWarningBeep();
      notify('error', t('once_cihaz_secin', 'Önce barkodu aktarmak için bir cihaz seçmelisiniz.'));
      setLastStatus('error');
      return;
    }

    try {
      if (adapter.sendBarcodeToConnection) {
        const res = await adapter.sendBarcodeToConnection(targetConnectionId, code);
        if (res.success) {
          playSuccessBeep();
          setLastStatus('success');
          notify('success', t('barkod_iletildi', 'Barkod iletildi: {{code}}', { code }));
        } else {
          playWarningBeep();
          setLastStatus('error');
          notify('error', res.message);
        }
      }
    } catch (err: any) {
      playErrorBeep();
      setLastStatus('error');
      notify('error', err?.message || t('barkod_iletilemedi', 'Barkod hedefe iletilemedi.'));
    }
  };

  useEffect(() => {
    return () => {
      stopCustomScan();
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: isLocalMode ? '450px' : 'calc(100vh - 80px)',
        padding: isLocalMode ? '0' : '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      {!isLocalMode && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--accent-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScanBarcode size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {t('barkod_terminali', 'Barkod Terminali')}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                {targetName
                  ? t('hedef_cihaza_bagli', 'Bağlı Cihaz: {{name}}', { name: targetName })
                  : t('cihaz_eslestirme_bekleniyor', 'Cihaz eşleştirmesi bekleniyor')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'scanner' ? 'settings' : 'scanner')}
              className="btn btn-secondary flex-row items-center gap-8"
            >
              <Settings size={18} />
              <span>{activeTab === 'scanner' ? t('ayarlar', 'Ayarlar') : t('tarayici', 'Tarayıcı')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'scanner' ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--glass-border)',
              padding: '16px',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {/* Durum Rozeti */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: targetConnectionId ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-primary)',
                  color: targetConnectionId ? 'var(--success)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <LinkIcon size={14} />
                <span>{targetName || t('cihaz_bagli_degil', 'Cihaz Bağlı Değil')}</span>
              </div>

              {effectiveScannerProductName && (
                <div
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: 'var(--bg-primary)',
                    color: 'var(--accent-primary)',
                    fontWeight: '600',
                  }}
                >
                  {effectiveScannerProductName}
                </div>
              )}
            </div>

            {/* Video / Kamera Alanı */}
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                height: '320px',
                borderRadius: '16px',
                background: '#000',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={zxingVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isScanning ? 'block' : 'none',
                }}
                playsInline
                muted
              />

              {!isScanning && (
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <Camera size={48} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    {t('kamera_kapali_baslatin', 'Kamera kapalı. Taramayı başlatmak için dokunun.')}
                  </p>
                </div>
              )}

              {isScanning && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    background: 'red',
                    boxShadow: '0 0 8px red',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              )}
            </div>

            {/* Son Okutulan Değer */}
            <div style={{ width: '100%', textAlign: 'center', margin: '16px 0' }}>
              {lastScanned ? (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {t('son_okutulan', 'Son Okutulan')}
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      color:
                        lastStatus === 'success'
                          ? 'var(--success)'
                          : lastStatus === 'error'
                          ? 'var(--danger)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {lastScanned}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t('barkod_okutulmasi_bekleniyor', 'Barkod veya seri numarası okutulması bekleniyor...')}
                </div>
              )}
            </div>

            {/* Kamera Aç / Kapa Butonu */}
            <button
              type="button"
              onClick={toggleScan}
              className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'} w-full`}
              style={{
                maxWidth: '480px',
                height: '48px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Camera size={20} />
              <span>{isScanning ? t('taramayi_durdur', 'Taramayı Durdur') : t('taramayi_baslat', 'Taramayı Başlat')}</span>
            </button>
          </div>
        ) : (
          <BarkodTerminaliAyarlar
            loadingUsers={loadingUsers}
            activeUsers={activeUsers}
            fetchActiveUsers={fetchActiveUsers}
            targetConnectionId={targetConnectionId}
            selectTarget={selectTarget}
            advancedMode={advancedMode}
            handleAdvancedModeChange={handleAdvancedModeChange}
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            handleCameraSelect={handleCameraSelect}
            disconnectTarget={disconnectTarget}
            autoConnect={autoConnect}
            handleAutoConnectChange={handleAutoConnectChange}
            isLocalMode={isLocalMode}
          />
        )}
      </div>
    </div>
  );
};

export default BarkodTerminaliPage;
