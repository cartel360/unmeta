import { describe, it, expect } from 'vitest';
import {
  sniff,
  validateSize,
  validateDimensions,
  cleanName,
  uniqueName,
  outputDimensions,
} from '../src/lib/image/formats';
import { parseStructure } from '../src/lib/image/structures';
import { compareMetadata } from '../src/lib/image/inspect';
import { queuedAfterCancel } from '../src/hooks/use-workspace';
function chunk(type: string, data: number[]) {
  const b = new Uint8Array(data.length + 12);
  new DataView(b.buffer).setUint32(0, data.length);
  b.set(new TextEncoder().encode(type), 4);
  b.set(data, 8);
  return b;
}
function png() {
  const h = new Uint8Array(13);
  new DataView(h.buffer).setUint32(0, 16);
  new DataView(h.buffer).setUint32(4, 12);
  return new Uint8Array([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk('IHDR', [...h]),
    ...chunk('tEXt', [...new TextEncoder().encode('parameters\0a private generation prompt')]),
    ...chunk('IEND', []),
  ]);
}
describe('content validation', () => {
  it('sniffs bytes instead of extensions', () => {
    expect(sniff(png())).toBe('image/png');
    expect(() => sniff(new TextEncoder().encode('not a photo.jpg'))).toThrow('Unsupported');
  });
  it('enforces file and dimension limits before allocation', () => {
    expect(() => validateSize(0)).toThrow();
    expect(() => validateSize(31 * 1024 ** 2)).toThrow();
    expect(() => validateDimensions(100000, 100000)).toThrow();
    expect(() => validateDimensions(8000, 5000)).toThrow();
    expect(() => validateDimensions(4000, 3000)).not.toThrow();
  });
});
describe('metadata structures', () => {
  it('reads PNG dimensions and AI text', () => {
    const s = parseStructure(png(), 'image/png');
    expect(s.width).toBe(16);
    expect(s.height).toBe(12);
    expect(s.fields).toContainEqual({
      key: 'PNG:parameters',
      category: 'PNG text',
      value: 'a private generation prompt',
    });
  });
  it('rejects truncated chunks', () => {
    expect(() => parseStructure(png().slice(0, -6), 'image/png')).toThrow();
  });
  it('recognizes JPEG EXIF and dimensions', () => {
    const b = new Uint8Array([
      255, 216, 255, 225, 0, 8, 69, 120, 105, 102, 0, 0, 255, 192, 0, 8, 8, 0, 12, 0, 16, 0, 255,
      217,
    ]);
    const s = parseStructure(b, 'image/jpeg');
    expect(s.width).toBe(16);
    expect(s.fields[0].key).toBe('Container:EXIF');
  });
  it('recognizes WebP XMP chunks', () => {
    const x = new TextEncoder().encode('<xmp>prompt</xmp>');
    const n = 12 + 8 + 10 + 8 + x.length;
    const b = new Uint8Array(n);
    b.set(new TextEncoder().encode('RIFF'));
    new DataView(b.buffer).setUint32(4, n - 8, true);
    b.set(new TextEncoder().encode('WEBPVP8X'), 8);
    new DataView(b.buffer).setUint32(16, 10, true);
    b[24] = 15;
    b[27] = 11;
    b.set(new TextEncoder().encode('XMP '), 30);
    new DataView(b.buffer).setUint32(34, x.length, true);
    b.set(x, 38);
    expect(parseStructure(b, 'image/webp').fields[0].category).toBe('XMP');
  });
});
describe('outputs', () => {
  it('resizes proportionally without upscaling', () => {
    expect(outputDimensions(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
    expect(outputDimensions(100, 50, 1200)).toEqual({ width: 100, height: 50 });
  });
  it('sanitizes names and handles colliding ZIP filenames', () => {
    expect(cleanName('../../a?.png', 'image/jpeg')).toBe('_.._a_-clean.jpg');
    const used = new Set<string>();
    expect(uniqueName('a.jpg', used)).toBe('a.jpg');
    expect(uniqueName('A.jpg', used)).toBe('A-2.jpg');
    expect(uniqueName('a.jpg', used)).toBe('a-3.jpg');
  });
  it('counts only previously detected absent fields', () => {
    const before = {
      fields: [
        { key: 'Artist', category: 'EXIF', value: 'a' },
        { key: 'Software', category: 'EXIF', value: 'b' },
      ],
      notes: [],
      checked: [],
    };
    expect(
      compareMetadata(before, {
        ...before,
        fields: [before.fields[1], { key: 'New', category: 'EXIF', value: 'encoder' }],
      }),
    ).toBe(1);
  });
  it('cancels pending work without erasing completed state', () => {
    expect(queuedAfterCancel('queued')).toBe('ready');
    expect(queuedAfterCancel('done')).toBe('done');
    expect(queuedAfterCancel('error')).toBe('error');
  });
});
describe('safety boundaries', () => {
  it('rejects incomplete JPEG segments', () => {
    expect(() =>
      parseStructure(new Uint8Array([255, 216, 255, 225, 255, 255, 0, 0]), 'image/jpeg'),
    ).toThrow('Corrupted');
  });
  it('flags animated PNG instead of flattening silently', () => {
    const b = png(),
      animated = new Uint8Array([
        ...b.subarray(0, 33),
        ...chunk('acTL', [0, 0, 0, 2, 0, 0, 0, 0]),
        ...b.subarray(33),
      ]);
    expect(parseStructure(animated, 'image/png').animated).toBe(true);
  });
  it('does not pretend compressed PNG text was read', () => {
    const b = png(),
      compressed = new Uint8Array([
        ...b.subarray(0, 33),
        ...chunk('zTXt', [65, 0, 0, 1, 2]),
        ...b.subarray(33),
      ]);
    expect(
      parseStructure(compressed, 'image/png').fields.some((f) =>
        f.value.includes('contents not checked'),
      ),
    ).toBe(true);
  });
  it('rejects a PNG with excessive metadata records', () => {
    const b = png(),
      text = chunk('tEXt', [65, 0, 66]);
    const huge = new Uint8Array([
      ...b.subarray(0, 33),
      ...Array.from({ length: 513 }, () => [...text]).flat(),
      ...b.subarray(33),
    ]);
    expect(() => parseStructure(huge, 'image/png')).toThrow('too many metadata');
  });
});
