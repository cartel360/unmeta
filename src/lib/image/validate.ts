import { sniff, validateSize, validateDimensions } from './formats';
import { parseStructure } from './structures';
import { inspect } from './inspect';
import type { ImageItem } from '@/types/image';
export async function validateFile(file: File): Promise<ImageItem> {
  validateSize(file.size);
  const b = new Uint8Array(await file.arrayBuffer()),
    format = sniff(b),
    s = parseStructure(b, format);
  validateDimensions(s.width, s.height);
  if (s.animated)
    throw new Error('Animated PNG and WebP are not supported. Export a still image first.');
  const inspection = await inspect(file, format, b);
  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
    format,
    width: s.width,
    height: s.height,
    inspection,
    status: 'ready',
  };
}
