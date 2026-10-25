'use client';
/* Local object URLs are intentionally rendered with native images. */
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { ScanLine, Check, ArrowRight, Download, Info } from 'lucide-react';
import type { ImageItem } from '@/types/image';
import { bytes } from '@/lib/image/formats';
import { download } from '@/lib/image/download';
import { Button } from './ui/button';
export function Inspector({ item }: { item: ImageItem }) {
  const [after, setAfter] = useState(false);
  const inspection = after && item.result ? item.result.inspection : item.inspection;
  const groups = Object.groupBy(inspection.fields, (f) => f.category);
  return (
    <section className="inspector" aria-label={`Metadata for ${item.file.name}`}>
      <div className="inspector-heading">
        <span>
          <ScanLine size={17} /> Image inspector
        </span>
        <span className="mono">{item.result ? 'BEFORE / AFTER' : 'ORIGINAL'}</span>
      </div>
      <div className="comparison">
        <div>
          <div className="preview checker">
            <img src={item.url} alt={`Original ${item.file.name}`} />
            <span>Original</span>
          </div>
          <div className="preview-caption">
            {bytes(item.file.size)}
            <span>
              {item.inspection.fields.length} detected{' '}
              {item.inspection.fields.length === 1 ? 'field' : 'fields'}
            </span>
          </div>
        </div>
        {item.result && (
          <>
            <ArrowRight className="compare-arrow" size={18} />
            <div>
              <div className="preview checker">
                <img src={item.result.url} alt={`Cleaned ${item.file.name}`} />
                <span>Cleaned</span>
              </div>
              <div className="preview-caption">
                {bytes(item.result.blob.size)}
                <span>
                  {item.result.inspection.fields.length} detected{' '}
                  {item.result.inspection.fields.length === 1 ? 'field' : 'fields'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      {item.result && (
        <div className="result-summary">
          <Check size={17} />
          <div>
            <strong>Image processed successfully.</strong>
            <p>
              {item.result.removed} previously detected{' '}
              {item.result.removed === 1 ? 'field' : 'fields'} absent from output ·{' '}
              {(item.result.duration / 1000).toFixed(2)} s<br />
              {item.result.width} × {item.result.height} ·{' '}
              {item.result.blob.type.replace('image/', '').toUpperCase()} ·{' '}
              {Math.abs((1 - item.result.blob.size / item.file.size) * 100).toFixed(1)}%{' '}
              {item.result.blob.size <= item.file.size ? 'smaller' : 'larger'}
            </p>
          </div>
          <Button size="sm" onClick={() => download(item.result!.blob, item.result!.name)}>
            <Download size={14} /> Download
          </Button>
        </div>
      )}
      <div className="metadata-toolbar">
        <strong>Embedded metadata</strong>
        {item.result && (
          <div className="segmented">
            <button onClick={() => setAfter(false)} aria-pressed={!after}>
              Before
            </button>
            <button onClick={() => setAfter(true)} aria-pressed={after}>
              After
            </button>
          </div>
        )}
      </div>
      <div className="metadata-fields" tabIndex={0} aria-label="Detected metadata fields">
        {inspection.fields.length === 0 ? (
          <div className="metadata-empty">
            <Check size={20} />
            <div>
              No supported metadata detected.<p>This is limited to the checks listed below.</p>
            </div>
          </div>
        ) : (
          Object.entries(groups).map(([group, fields]) => (
            <div key={group} className="metadata-group">
              <h4>{group}</h4>
              <dl>
                {fields?.map((f, i) => (
                  <div key={f.key + i}>
                    <dt>{f.key}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </div>
      <details className="coverage">
        <summary>Inspection coverage</summary>
        <dl>
          {[
            {
              name: 'EXIF containers',
              checked: true,
              found: inspection.fields.some((f) => f.key === 'Container:EXIF'),
            },
            {
              name: 'XMP containers',
              checked: true,
              found: inspection.fields.some((f) => f.key === 'Container:XMP'),
            },
            {
              name: 'IPTC containers',
              checked:
                (after && item.result ? item.result.blob.type : item.format) === 'image/jpeg',
              found: inspection.fields.some((f) => f.key === 'Container:IPTC'),
            },
            {
              name: 'PNG text',
              checked: (after && item.result ? item.result.blob.type : item.format) === 'image/png',
              found: inspection.fields.some((f) => f.key.startsWith('PNG:')),
            },
            {
              name: 'ICC profile containers',
              checked: true,
              found: inspection.fields.some((f) => /Container:(ICC|ICCP)$/.test(f.key)),
            },
            {
              name: 'Limited C2PA indicators',
              checked: true,
              found: inspection.fields.some((f) => f.key === 'Container:C2PA'),
            },
            { name: 'C2PA signature validation', checked: false, found: false },
            { name: 'Invisible pixel watermarks', checked: false, found: false },
          ].map((check) => (
            <div key={check.name}>
              <dt>{check.name}</dt>
              <dd>
                {!check.checked
                  ? 'Not checked'
                  : check.found
                    ? 'Detected'
                    : 'Not detected by this parser'}
              </dd>
            </div>
          ))}
        </dl>
      </details>
      <div className="inspection-notes">
        <Info size={15} />
        <div>
          <strong>Inspection has limits.</strong>
          <p>Checked: {inspection.checked.join(', ')}.</p>
          {inspection.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
          <p>
            Counts include readable fields and container indicators, and may overlap. A missing
            field is not a guarantee that every metadata type was removed.
          </p>
        </div>
      </div>
    </section>
  );
}
