# @akalin/barcode_module

Webakus ERP ekosistemi için bağımsız, yeniden kullanılabilir barkod yönetimi, etiket basımı ve barkod terminali modülüdür.

## Özellikler
- **Barkod & Seri No Etiket Basımı**: Termal (40x80mm) ve A4 çoklu sayfa formatında QR kodlu ve barkodlu etiket basımı.
- **Barkod Terminali**: Kamera / ZXing tabanlı gelişmiş barkod tarayıcı, çoklu kamera seçimi, sürekli okuma modu.
- **Eş Zamanlı Ağ & Cihaz Senkronizasyonu**: Mobil tarayıcılar ve masaüstü ERP istemcileri arasında SignalR / WebSocket / HTTP köprüsü (`NetworkSender`).
- **Endüstriyel Tarayıcı Sesleri (PCM WAV)**: Zebra, Honeywell ve Motorola endüstri standartlarında dahili ses motoru (`playSuccessBeep`, `playWarningBeep`, `playErrorBeep`).
- **Barkod & Seri No Tespit Modalı**: Fiş ve belgelerdeki ürünlerle seri numaralarını eşleştiren gelişmiş operasyon penceresi (`BarkodVeSeriNoTespitModal`).
- **Global Donanım Tarayıcı Hook'u**: Klavye taklitli fiziksel barkod okuyucuları yakalayan `useGlobalBarcodeScanner`.
- **@akalin/module_core Entegrasyonu**: `createBarcodeModule()` fabrika fonksiyonu ile dinamik modül kaydı.
