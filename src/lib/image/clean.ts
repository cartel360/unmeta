import type { ImageItem, Options, Result, Format } from '@/types/image';
import { cleanName } from './formats';
import { inspect, compareMetadata } from './inspect';
import { encodeMain } from './encode';
async function encodeWorker(
  file: Blob,
  format: Format,
  options: Options,
): Promise<{ blob: Blob; width: number; height: number }> {
  const worker = new Worker(new URL('../../workers/image-processor.worker.ts', import.meta.url));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker timed out.'));
    }, 45000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (e) => {
      finish();
      if (e.data.ok) resolve(e.data);
      else reject(new Error('Worker encoding unavailable.'));
    };
    worker.onerror = () => {
      finish();
      reject(new Error('Worker unavailable.'));
    };
    worker.postMessage({ file, format, options });
  });
}
export async function cleanImage(item: ImageItem, options: Options): Promise<Result> {
  const start = performance.now(),
    format = options.format === 'original' ? item.format : options.format;
  let encoded;
  if (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap === 'function'
  ) {
    try {
      encoded = await encodeWorker(item.file, format, options);
    } catch {
      encoded = await encodeMain(item.file, format, options);
    }
  } else encoded = await encodeMain(item.file, format, options);
  const inspection = await inspect(encoded.blob, format);
  return {
    ...encoded,
    inspection,
    url: URL.createObjectURL(encoded.blob),
    duration: performance.now() - start,
    removed: compareMetadata(item.inspection, inspection),
    name: cleanName(item.file.name, format),
  };
}
