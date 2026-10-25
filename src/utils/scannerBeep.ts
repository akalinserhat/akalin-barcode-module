/**
 * @akalin/barcode_module - Endüstri Standardı Barkod Tarayıcı Sesleri (scannerBeep.ts)
 * Harici ses dosyası veya ağ gerektirmez; saf Web Audio PCM WAV blobları üretir.
 *
 * Frekans referansları:
 *  - Başarı : 1800 Hz, ~80 ms  — Zebra DS22xx / DS36xx serisi
 *  - Uyarı  : 900 Hz, çift bip — Honeywell Voyager / Xenon serisi (iş mantığı hatası)
 *  - Hata   : 400 Hz, çift bip — Motorola / Symbol serisi (teknik/bağlantı hatası)
 */

const SAMPLE_RATE = 22050;

function buildWav(samples: Int16Array): Blob {
  const dataLen = samples.byteLength;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);

  const w = (off: number, str: string) =>
    [...str].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)));

  w(0, 'RIFF');
  v.setUint32(4, 36 + dataLen, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, dataLen, true);
  new Int16Array(buf, 44).set(samples);

  return new Blob([buf], { type: 'audio/wav' });
}

function generateTone(frequencyHz: number, durationMs: number, amplitude = 0.75): Int16Array {
  const n = Math.floor((SAMPLE_RATE * durationMs) / 1000);
  const samples = new Int16Array(n);
  const attackN = Math.floor((SAMPLE_RATE * 5) / 1000);
  const releaseN = Math.floor((SAMPLE_RATE * 12) / 1000);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let env = 1;
    if (i < attackN) env = i / attackN;
    else if (i > n - releaseN) env = (n - i) / releaseN;
    samples[i] = Math.round(Math.sin(2 * Math.PI * frequencyHz * t) * env * amplitude * 32767);
  }
  return samples;
}

function concat(...parts: Int16Array[]): Int16Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Int16Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function silence(ms: number): Int16Array {
  return new Int16Array(Math.floor((SAMPLE_RATE * ms) / 1000));
}

let _successBlob: Blob | null = null;
let _warningBlob: Blob | null = null;
let _errorBlob: Blob | null = null;

function getSuccessBlob(): Blob {
  if (!_successBlob) {
    _successBlob = buildWav(generateTone(1800, 80, 0.8));
  }
  return _successBlob;
}

function getWarningBlob(): Blob {
  if (!_warningBlob) {
    _warningBlob = buildWav(
      concat(generateTone(900, 110, 0.7), silence(60), generateTone(900, 110, 0.7))
    );
  }
  return _warningBlob;
}

function getErrorBlob(): Blob {
  if (!_errorBlob) {
    _errorBlob = buildWav(
      concat(generateTone(400, 130, 0.65), silence(70), generateTone(400, 130, 0.65))
    );
  }
  return _errorBlob;
}

let _successUrl: string | null = null;
let _warningUrl: string | null = null;
let _errorUrl: string | null = null;

function play(url: string) {
  try {
    if (typeof window === 'undefined') return;
    const audio = new Audio(url);
    audio.volume = 1;
    audio.play().catch(() => {});
  } catch {}
}

/** ✅ Başarı sesi — Zebra standardı, 1800 Hz tek bip */
export function playSuccessBeep() {
  if (typeof window === 'undefined') return;
  if (!_successUrl) _successUrl = URL.createObjectURL(getSuccessBlob());
  play(_successUrl);
}

/** ⚠️ Uyarı sesi — Honeywell standardı, 900 Hz çift bip (iş mantığı uyarısı) */
export function playWarningBeep() {
  if (typeof window === 'undefined') return;
  if (!_warningUrl) _warningUrl = URL.createObjectURL(getWarningBlob());
  play(_warningUrl);
}

/** ❌ Hata sesi — Motorola/Symbol standardı, 400 Hz çift bip (teknik hata) */
export function playErrorBeep() {
  if (typeof window === 'undefined') return;
  if (!_errorUrl) _errorUrl = URL.createObjectURL(getErrorBlob());
  play(_errorUrl);
}
