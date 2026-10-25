import type { Format } from '@/types/image';
export const MAX_BYTES = 30 * 1024 * 1024;
export const MAX_PIXELS = 32_000_000;
export const MAX_DIMENSION = 16384;
export const MAX_FILES = 30;
export const MAX_RESULT_BYTES = 200 * 1024 * 1024;
export const MAX_SESSION_BYTES = 150 * 1024 * 1024;
export function sniff(b: Uint8Array): Format {
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) return 'image/png';
  const t = new TextDecoder('latin1');
  if (t.decode(b.slice(0, 4)) === 'RIFF' && t.decode(b.slice(8, 12)) === 'WEBP')
    return 'image/webp';
  throw new Error('Unsupported file. Choose a real JPEG, PNG, or WebP image.');
}
export function validateSize(size: number) {
  if (!size) throw new Error('This file is empty.');
  if (size > MAX_BYTES) throw new Error('This image exceeds the 30 MB file limit.');
}
export function validateDimensions(width: number, height: number) {
  if (
    !width ||
    !height ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    width * height > MAX_PIXELS
  )
    throw new Error('Image dimensions exceed the limit: 32 megapixels and 16,384 pixels per side.');
}
export function outputDimensions(w: number, h: number, max: number) {
  const scale = max > 0 ? Math.min(1, max / Math.max(w, h)) : 1;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}
export function cleanName(name: string, format: Format) {
  return (
    (name
      .replace(/\.[^.]*$/, '')
      .replace(/[^a-zA-Z0-9_\- .]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 110) || 'image') +
    '-clean.' +
    { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[format]
  );
}
export function uniqueName(name: string, used: Set<string>) {
  let n = name,
    i = 2;
  while (used.has(n.toLowerCase())) {
    n = name.replace(/(\.[^.]+)$/, `-${i++}$1`);
  }
  used.add(n.toLowerCase());
  return n;
}
export function bytes(n: number) {
  return n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;
}
