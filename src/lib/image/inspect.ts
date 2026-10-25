import type { Field, Format, Inspection } from '@/types/image';
import { parseStructure } from './structures';
function category(key: string) {
  if (/gps|latitude|longitude|altitude/i.test(key)) return 'Location';
  if (/date|time|offset/i.test(key)) return 'Dates';
  if (/make|model|lens|iso|exposure|aperture|focal|serial/i.test(key)) return 'Camera';
  if (/artist|copyright|owner|creator/i.test(key)) return 'Ownership';
  if (/software|tool|prompt|parameter|generator/i.test(key)) return 'Software & AI';
  return 'EXIF';
}
export async function inspect(
  blob: Blob,
  format: Format,
  buffer?: Uint8Array,
): Promise<Inspection> {
  const b = buffer ?? new Uint8Array(await blob.arrayBuffer());
  const structure = parseStructure(b, format);
  const fields: Field[] = [...structure.fields];
  const notes = [
    'Invisible pixel-based watermarks are not checked. C2PA signatures and credential validity are not checked. Unknown vendor metadata may not be detected.',
  ];
  const checked = [
    'EXIF containers',
    'XMP containers',
    'ICC profiles',
    'Limited content credential indicators',
    ...(format === 'image/jpeg' ? ['IPTC containers', 'JPEG comments'] : []),
    ...(format === 'image/png' ? ['PNG text'] : []),
  ];
  if (format === 'image/webp') {
    notes.push(
      'Detailed WebP EXIF, IPTC, and XMP fields are not checked. WebP container indicators and raw XMP packets are inspected.',
    );
    return { fields, notes, checked };
  }
  try {
    const exifr = await import('exifr');
    const parsed = await exifr.parse(b, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      iptc: true,
      icc: false,
      jfif: false,
      ihdr: false,
      mergeOutput: true,
    });
    checked.push('Supported EXIF / GPS / XMP / IPTC fields');
    if (parsed)
      for (const [key, value] of Object.entries(parsed)) {
        if (
          value == null ||
          /^(ImageWidth|ImageHeight|ExifImageWidth|ExifImageHeight|PixelXDimension|PixelYDimension|ColorSpace|ComponentsConfiguration)$/.test(
            key,
          )
        )
          continue;
        const str =
          value instanceof Date
            ? value.toISOString()
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
        fields.push({ key, category: category(key), value: str.slice(0, 8000) });
      }
  } catch {
    notes.push(
      'Detailed EXIF/XMP parsing was unavailable for this image. Container indicators are still shown.',
    );
  }
  return { fields, notes, checked };
}
export function compareMetadata(before: Inspection, after: Inspection) {
  const keys = new Set(after.fields.map((f) => f.key));
  return before.fields.filter((f) => !keys.has(f.key)).length;
}
