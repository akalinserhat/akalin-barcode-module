/**
 * @akalin/barcode_module - Barkod Terminali Ayarları Bileşeni (BarkodTerminaliAyarlar.tsx)
 * Aktif cihazlar, hedef bağlantı eşleştirmesi ve kamera/tarayıcı seçimini yönetir.
 */

import React, { useState } from 'react';
import { Monitor, RefreshCw, Settings, Info, Smartphone, Unplug, User, Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TerminalUserDTO } from '../types';

export interface BarkodTerminaliAyarlarProps {
  loadingUsers: boolean;
  activeUsers: TerminalUserDTO[];
  fetchActiveUsers: () => void;
  targetConnectionId: string;
  selectTarget: (connId: string, name?: string) => void;
  advancedMode: boolean;
  handleAdvancedModeChange: (checked: boolean) => void;
  cameras: MediaDeviceInfo[];
  selectedCameraId: string;
  handleCameraSelect: (deviceId: string) => void;
  disconnectTarget: () => void;
  autoConnect: boolean;
  handleAutoConnectChange: (checked: boolean) => void;
  isLocalMode?: boolean;
  currentConnectionId?: string;
}

export const BarkodTerminaliAyarlar: React.FC<BarkodTerminaliAyarlarProps> = ({
  loadingUsers,
  activeUsers,
  fetchActiveUsers,
  targetConnectionId,
  selectTarget,
  advancedMode,
  handleAdvancedModeChange,
  cameras,
  selectedCameraId,
  handleCameraSelect,
  disconnectTarget,
  autoConnect,
  handleAutoConnectChange,
  isLocalMode = false,
  currentConnectionId,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'cihazlar' | 'kamera'>(isLocalMode ? 'kamera' : 'cihazlar');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>
      {!isLocalMode && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            background: 'var(--bg-secondary)',
            padding: '6px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('cihazlar')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'cihazlar' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'cihazlar' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'cihazlar' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'cihazlar' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Monitor size={20} /> {t('aktif_cihazlar', 'Aktif Cihazlar')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kamera')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'kamera' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'kamera' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'kamera' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'kamera' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Settings size={20} /> {t('tarayici_ayarlari', 'Tarayıcı Ayarları')}
          </button>
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {activeTab === 'cihazlar' && (
          <div className="fade-in-fast">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '20px',
                }}
              >
                <Monitor size={24} className="text-primary" /> {t('aktif_cihazlar', 'Aktif Cihazlar')}
              </h3>
              <button
                type="button"
                onClick={fetchActiveUsers}
                disabled={loadingUsers}
                className="btn-icon"
                style={{ padding: '8px', color: 'var(--text-secondary)', background: 'transparent' }}
                title={t('yenile', 'Yenile')}
              >
                <RefreshCw size={20} className={loadingUsers ? 'spin' : ''} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              {t(
                'barkodu_gondermek_istediginiz_cihazi_secin',
                'Barkod verilerini aktarmak istediğiniz cihazı listeden seçerek eşleştiriniz.'
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {loadingUsers && activeUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  {t('yukleniyor', 'Yükleniyor...')}
                </div>
              )}
              {!loadingUsers && activeUsers.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px dashed var(--glass-border)',
                  }}
                >
                  <div style={{ color: 'var(--warning)', marginBottom: '12px' }}>
                    <Info size={32} style={{ margin: '0 auto' }} />
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    {t('aktif_cihaz_bulunamadi', 'Aktif Cihaz Bulunamadı')}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {t(
                      'sistemde_baska_cihaz_yok_aciklama',
                      'Aynı ağda veya hesapta açık bir ERP istemcisi tespit edilemedi.'
                    )}
                  </p>
                </div>
              )}
              {activeUsers.map((user) => (
                <div
                  key={user.connectionId}
                  onClick={() => selectTarget(user.connectionId, user.kullaniciAdi)}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div className="flex-row items-center gap-16">
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={24} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '16px',
                            color: 'var(--text-primary)',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {user.kullaniciAdi || user.cihazAdi || user.connectionId}
                          {currentConnectionId && user.connectionId === currentConnectionId && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--success)',
                                fontWeight: '600',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                              }}
                            >
                              {t('bu_cihaz', 'Bu Cihaz')}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--bg-secondary)',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {user.cihazAdi?.toLowerCase().includes('mobile') ? (
                            <Smartphone size={14} />
                          ) : (
                            <Monitor size={14} />
                          )}
                          {user.cihazAdi?.toLowerCase().includes('mobile')
                            ? t('mobil_cihaz', 'Telefon / Tablet')
                            : t('masaustu', 'Bilgisayar')}
                        </div>
                      </div>
                    </div>
                    <div className="flex-row items-center gap-16">
                      {targetConnectionId === user.connectionId && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex-row items-center gap-8"
                          title={t('oto_baglan_aciklama', 'Terminal açıldığında bu cihaza otomatik bağlan')}
                        >
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                            {t('oto_baglan', 'Oto Bağlan')}
                          </span>
                          <label
                            className="switch"
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: '36px',
                              height: '20px',
                              flexShrink: 0,
                              margin: 0,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={autoConnect}
                              onChange={(e) => handleAutoConnectChange(e.target.checked)}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span
                              className="slider round"
                              style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: autoConnect ? 'var(--primary)' : '#ccc',
                                transition: '.4s',
                                borderRadius: '34px',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  content: '""',
                                  height: '14px',
                                  width: '14px',
                                  left: autoConnect ? '19px' : '3px',
                                  bottom: '3px',
                                  backgroundColor: 'white',
                                  transition: '.4s',
                                  borderRadius: '50%',
                                }}
                              />
                            </span>
                          </label>
                        </div>
                      )}
                      {targetConnectionId === user.connectionId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            disconnectTarget();
                          }}
                          className="btn-icon"
                          style={{
                            color: 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--danger-light)',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          title={t('baglantiyi_kes', 'Bağlantıyı Kes')}
                        >
                          <Unplug size={18} />
                        </button>
                      ) : (
                        <div
                          style={{
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.1)',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                          }}
                        >
                          <Plug size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'kamera' && (
          <div className="fade-in-fast">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h3
                style={{
                  margin: '0',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Settings size={24} className="text-primary" /> {t('tarayici_modu', 'Tarayıcı Modu')}
              </h3>
            </div>

            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {t('gelismis_kamera_modu', 'Gelişmiş Kamera & Lens Seçimi (ZXing)')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {t(
                      'gelismis_kamera_modu_aciklama',
                      'Cihazınızdaki makro, geniş açı veya arka lensleri manuel seçmenizi sağlar.'
                    )}
                  </div>
                </div>
                <label
                  className="switch"
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '50px',
                    height: '24px',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={advancedMode}
                    onChange={(e) => handleAdvancedModeChange(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    className="slider round"
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: advancedMode ? 'var(--primary)' : '#ccc',
                      transition: '.4s',
                      borderRadius: '34px',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '""',
                        height: '16px',
                        width: '16px',
                        left: advancedMode ? '30px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>

              {advancedMode && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    {t('kullanilacak_kamera', 'Kullanılacak Kamera')}
                  </label>
                  {cameras.length === 0 ? (
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <div className="spinner" style={{ width: '14px', height: '14px' }} />
                      {t('kameralar_araniyor', 'Kameralar taranıyor veya izin gerekli...')}
                    </div>
                  ) : (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleCameraSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                      }}
                    >
                      {cameras.map((cam, idx) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label || `Kamera ${idx + 1} (${cam.deviceId.substring(0, 5)}...)`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarkodTerminaliAyarlar;
