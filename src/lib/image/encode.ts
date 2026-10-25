import type { Format, Options } from '@/types/image';
import { outputDimensions, validateDimensions } from './formats';
export async function encodeOffscreen(file: Blob, format: Format, options: Options) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    validateDimensions(bitmap.width, bitmap.height);
    const { width, height } = outputDimensions(bitmap.width, bitmap.height, options.maxDimension);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    if (format === 'image/jpeg') {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    try {
      const blob = await canvas.convertToBlob({ type: format, quality: options.quality });
      if (blob.type !== format) throw new Error('This browser cannot encode the selected format.');
      return { blob, width, height };
    } finally {
      canvas.width = canvas.height = 1;
    }
  } finally {
    bitmap.close();
  }
}
export async function encodeMain(file: Blob, format: Format, options: Options) {
  let image: ImageBitmap | HTMLImageElement;
  let url: string | undefined;
  let canvas: HTMLCanvasElement | undefined;
  if (typeof createImageBitmap === 'function') {
    try {
      image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      image = await load();
    }
  } else image = await load();
  async function load() {
    url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
      return img;
    } catch {
      URL.revokeObjectURL(url);
      throw new Error(
        'This image could not be decoded. It may be corrupted or unsupported by your browser.',
      );
    }
  }
  try {
    const w = image instanceof HTMLImageElement ? image.naturalWidth : image.width,
      h = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    validateDimensions(w, h);
    const { width, height } = outputDimensions(w, h, options.maxDimension);
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    if (format === 'image/jpeg') {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas!.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('Image encoding failed. Try a smaller output size.')),
        format,
        options.quality,
      ),
    );
    canvas.width = canvas.height = 1;
    if (blob.type !== format) throw new Error('This browser cannot encode the selected format.');
    return { blob, width, height };
  } finally {
    if (canvas) canvas.width = canvas.height = 1;
    if ('close' in image) image.close();
    if (url) URL.revokeObjectURL(url);
  }
}
