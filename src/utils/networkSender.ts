/**
 * @akalin/barcode_module - Ağ Üzerinden Barkod Gönderici (networkSender.ts)
 * Harici HTTP kütüphanelerine bağımlı olmadan WebSocket ve fetch API kullanır.
 */

export interface SendResult {
  success: boolean;
  message: string;
}

export const sendBarcodeToTarget = async (url: string, barcode: string): Promise<SendResult> => {
  if (!url) {
    return { success: false, message: 'Hedef URL yapılandırılmamış.' };
  }

  try {
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      // WebSocket iletişimi
      return new Promise((resolve) => {
        let finished = false;
        const ws = new WebSocket(url);

        const timeoutId = setTimeout(() => {
          if (!finished) {
            finished = true;
            try {
              ws.close();
            } catch {}
            resolve({ success: false, message: 'Bağlantı zaman aşımına uğradı.' });
          }
        }, 5000);

        ws.onopen = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timeoutId);
            ws.send(
              JSON.stringify({
                type: 'BARCODE',
                data: barcode,
                timestamp: new Date().toISOString(),
              })
            );
            setTimeout(() => {
              try {
                ws.close();
              } catch {}
            }, 50);
            resolve({ success: true, message: 'Barkod gönderildi (WebSocket).' });
          }
        };

        ws.onerror = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timeoutId);
            resolve({ success: false, message: 'WebSocket bağlantı hatası oluştu.' });
          }
        };
      });
    } else {
      // HTTP POST iletişimi
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          type: 'BARCODE',
          data: barcode,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return { success: false, message: `Sunucu hatası: HTTP ${response.status}` };
      }

      return { success: true, message: 'Barkod gönderildi (HTTP).' };
    }
  } catch (error: any) {
    let msg = 'Gönderim başarısız.';
    if (error.name === 'AbortError') {
      msg = 'Hedef sunucuya ulaşılamadı (Zaman aşımı).';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
};
