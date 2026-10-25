import type { Field, Format } from '@/types/image';
const decoder = new TextDecoder('latin1');
export type Structure = { fields: Field[]; width: number; height: number; animated: boolean };
export function parseStructure(b: Uint8Array, format: Format): Structure {
  const result: Structure = { fields: [], width: 0, height: 0, animated: false };
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const text = (start: number, end: number) => decoder.decode(b.subarray(start, end));
  const add = (key: string, category: string, value: string) => {
    if (result.fields.length >= 512)
      throw new Error('This image has too many metadata records to inspect safely.');
    result.fields.push({ key, category, value: value.slice(0, 8000) });
  };
  if (format === 'image/png') {
    let p = 8,
      ended = false,
      chunks = 0;
    while (p + 12 <= b.length) {
      if (++chunks > 10000) throw new Error('PNG structure is too complex to inspect safely.');
      const len = v.getUint32(p);
      const type = text(p + 4, p + 8);
      if (p === 8 && type !== 'IHDR') throw new Error('PNG must begin with an image header.');
      if (len > b.length - p - 12) throw new Error('Corrupted PNG chunk.');
      const start = p + 8,
        end = start + len;
      if (type === 'IHDR') {
        if (len !== 13 || p !== 8) throw new Error('Invalid or repeated PNG header.');
        result.width = v.getUint32(start);
        result.height = v.getUint32(start + 4);
      }
      if (type === 'acTL') result.animated = true;
      if (type === 'tEXt') {
        const zero = b.indexOf(0, start);
        if (zero < end && zero >= start)
          add(`PNG:${text(start, zero)}`, 'PNG text', text(zero + 1, end));
      }
      if (type === 'iTXt') {
        const z = b.indexOf(0, start);
        if (z >= start && z + 3 < end) {
          let q = z + 3;
          for (let i = 0; i < 2; i++) {
            const next = b.indexOf(0, q);
            if (next < 0 || next >= end) {
              q = end;
              break;
            }
            q = next + 1;
          }
          add(
            `PNG:${text(start, z)}`,
            'PNG text',
            b[z + 1] === 0
              ? new TextDecoder().decode(b.subarray(q, end))
              : 'Compressed international text present (contents not checked)',
          );
        }
      }
      if (type === 'zTXt')
        add(`PNG:compressed:${p}`, 'PNG text', 'Compressed text present (contents not checked)');
      if (type === 'eXIf') add('Container:EXIF', 'EXIF', 'EXIF chunk present');
      if (type === 'iCCP') add('Container:ICC', 'Color profile', 'Embedded ICC profile present');
      if (type === 'caBX')
        add(
          'Container:C2PA',
          'Content credentials',
          'C2PA container indicator; credentials not validated',
        );
      if (type === 'IEND') {
        ended = true;
        break;
      }
      p = end + 4;
    }
    if (!ended || !result.width) throw new Error('Incomplete PNG image.');
  } else if (format === 'image/jpeg') {
    let p = 2;
    while (p + 4 <= b.length) {
      if (b[p] !== 255) throw new Error('Invalid JPEG structure.');
      let marker = b[p + 1];
      while (marker === 255) {
        p++;
        marker = b[p + 1];
      }
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) {
        p += 2;
        continue;
      }
      const len = v.getUint16(p + 2);
      if (len < 2 || p + 2 + len > b.length) throw new Error('Corrupted JPEG segment.');
      const start = p + 4,
        end = p + 2 + len;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      ) {
        if (len < 8 || result.width) throw new Error('Invalid or repeated JPEG frame.');
        result.height = v.getUint16(start + 1);
        result.width = v.getUint16(start + 3);
      }
      if (marker === 0xe1) {
        const prefix = text(start, Math.min(end, start + 40));
        if (prefix.startsWith('Exif')) add('Container:EXIF', 'EXIF', 'EXIF segment present');
        else if (/ns\.adobe\.com\/(xap|xmp)/.test(prefix))
          add('Container:XMP', 'XMP', text(start, end));
        else
          add(
            'Container:APP1',
            'Other metadata',
            'Unrecognized APP1 segment; contents not checked',
          );
      }
      if (marker === 0xed) add('Container:IPTC', 'IPTC', 'Photoshop / IPTC segment present');
      if (marker === 0xe2 && text(start, start + 11) === 'ICC_PROFILE')
        add('Container:ICC', 'Color profile', 'Embedded ICC profile present');
      if (marker === 0xeb && /JP|jumb|c2pa/i.test(text(start, Math.min(end, start + 100))))
        add('Container:C2PA', 'Content credentials', 'JUMBF / credential indicator; not validated');
      if (marker === 0xfe) add('JPEG:comment', 'Comments', text(start, end));
      p = end;
    }
  } else {
    if (v.getUint32(4, true) + 8 > b.length) throw new Error('Incomplete WebP image.');
    for (let p = 12; p + 8 <= b.length;) {
      const type = text(p, p + 4),
        len = v.getUint32(p + 4, true),
        s = p + 8,
        e = s + len;
      if (e > b.length) throw new Error('Corrupted WebP chunk.');
      if (type === 'VP8X' && len >= 10) {
        if (p !== 12) throw new Error('Invalid or repeated extended WebP header.');
        result.width = 1 + b[s + 4] + (b[s + 5] << 8) + (b[s + 6] << 16);
        result.height = 1 + b[s + 7] + (b[s + 8] << 8) + (b[s + 9] << 16);
        result.animated = !!(b[s] & 2);
      }
      if (type === 'VP8 ' && len >= 10) {
        const width = v.getUint16(s + 6, true) & 0x3fff,
          height = v.getUint16(s + 8, true) & 0x3fff;
        if (result.width && (result.width !== width || result.height !== height))
          throw new Error('Conflicting WebP dimensions.');
        result.width = width;
        result.height = height;
      }
      if (type === 'VP8L' && len >= 5) {
        const bits = v.getUint32(s + 1, true),
          width = (bits & 0x3fff) + 1,
          height = ((bits >>> 14) & 0x3fff) + 1;
        if (result.width && (result.width !== width || result.height !== height))
          throw new Error('Conflicting WebP dimensions.');
        result.width = width;
        result.height = height;
      }
      if (type === 'ANIM') result.animated = true;
      if (['EXIF', 'XMP ', 'ICCP', 'C2PA'].includes(type))
        add(
          `Container:${type.trim()}`,
          { EXIF: 'EXIF', 'XMP ': 'XMP', ICCP: 'Color profile', C2PA: 'Content credentials' }[
            type
          ]!,
          type === 'XMP '
            ? text(s, e)
            : `${type.trim()} chunk present${type === 'C2PA' ? '; credentials not validated' : ''}`,
        );
      p = e + (len % 2);
    }
  }
  return result;
}
