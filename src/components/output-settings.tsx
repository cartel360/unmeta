'use client';
import { useState, useId, type Dispatch, type SetStateAction } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { Options } from '@/types/image';
export function OutputSettings({
  options,
  setOptions,
  busy,
}: {
  options: Options;
  setOptions: Dispatch<SetStateAction<Options>>;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="options">
      <button
        className="options-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <SlidersHorizontal size={15} /> Output settings
        <span>
          {options.format === 'original'
            ? 'Original format'
            : options.format.replace('image/', '').toUpperCase()}{' '}
          ·{' '}
          {options.format === 'image/png'
            ? 'PNG encoding'
            : `${Math.round(options.quality * 100)}% quality`}
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="options-body" id={`${id}-panel`}>
          <div className="option-field">
            <label htmlFor={`${id}-format`}>Output format</label>
            <select
              id={`${id}-format`}
              disabled={busy}
              value={options.format}
              onChange={(e) =>
                setOptions({ ...options, format: e.target.value as Options['format'] })
              }
            >
              <option value="original">Preserve original</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div className="option-field">
            <label htmlFor={`${id}-quality`}>
              JPEG / WebP quality <span>{Math.round(options.quality * 100)}%</span>
            </label>
            <input
              id={`${id}-quality`}
              disabled={busy}
              type="range"
              min="10"
              max="100"
              value={options.quality * 100}
              onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) / 100 })}
            />
          </div>
          <div className="option-field">
            <label htmlFor={`${id}-resize`}>Resize longest edge</label>
            <select
              id={`${id}-resize`}
              disabled={busy}
              value={options.maxDimension}
              onChange={(e) => setOptions({ ...options, maxDimension: Number(e.target.value) })}
            >
              <option value="0">Keep dimensions</option>
              <option value="4096">4,096 px</option>
              <option value="2048">2,048 px</option>
              <option value="1200">1,200 px</option>
              <option value="800">800 px</option>
            </select>
          </div>
          <div className="option-field">
            <label htmlFor={`${id}-background`}>JPEG background</label>
            <input
              id={`${id}-background`}
              disabled={busy}
              type="color"
              value={options.background}
              onChange={(e) => setOptions({ ...options, background: e.target.value })}
            />
          </div>
          <p>
            Re-encoding may change quality, file size, and color profiles. PNG and WebP preserve
            transparency; JPEG uses your chosen background. Settings apply to images not yet
            processed.
          </p>
        </div>
      )}
    </div>
  );
}
