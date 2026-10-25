'use client';
/* eslint-disable @next/next/no-img-element */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LockKeyhole,
  Check,
  LoaderCircle,
  X,
  Download,
  ScanLine,
  Plus,
  Trash2,
  Square,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { Options } from '@/types/image';
import { bytes } from '@/lib/image/formats';
import { download, downloadZip } from '@/lib/image/download';
import { Button } from './ui/button';
import { Inspector } from './inspector';
import { UploadArea } from './upload-area';
import { OutputSettings } from './output-settings';
export function Workspace() {
  const ws = useWorkspace(),
    [selected, setSelected] = useState<string>(),
    [options, setOptions] = useState<Options>({
      format: 'original',
      quality: 0.94,
      maxDimension: 0,
      background: '#ffffff',
    }),
    [zip, setZip] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null),
    reduce = useReducedMotion();
  const addRef = useRef(ws.add);
  useEffect(() => {
    addRef.current = ws.add;
  });
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        void addRef.current(files);
      }
    };
    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  }, []);
  const choose = useCallback(() => input.current?.click(), []);
  const completed = ws.items.filter((i) => i.result),
    item = ws.items.find((i) => i.id === selected),
    locked = ws.busy || ws.adding || zip !== null;
  async function zipAll() {
    setZip(0);
    try {
      await downloadZip(ws.items, setZip);
    } catch {
      ws.setErrors(['ZIP creation failed. Try downloading individually or using a smaller batch.']);
    } finally {
      setZip(null);
    }
  }
  return (
    <motion.div
      className="tool-shell"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="tool-top">
        <span>
          <span className="status-dot" /> YOUR PRIVATE WORKSPACE
        </span>
        <span className="local-label">
          <LockKeyhole size={12} /> Local only
        </span>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        tabIndex={-1}
        className="sr-only"
        aria-label="Upload image files"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          void ws.add(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      {ws.items.length === 0 ? (
        <UploadArea adding={ws.adding} disabled={locked} onFiles={ws.add} onChoose={choose} />
      ) : (
        <div className="workspace-content">
          <div className="workspace-toolbar">
            <div>
              <h2>
                Your images<span>{ws.items.length}</span>
              </h2>
              <p>
                {completed.length
                  ? `${completed.length} processed · Ready to download`
                  : 'Ready for a little less metadata.'}
              </p>
            </div>
            <div>
              <Button variant="secondary" size="sm" disabled={locked} onClick={choose}>
                <Plus size={14} /> Add images
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={locked}
                onClick={() => {
                  ws.clear();
                  setSelected(undefined);
                }}
                aria-label="Clear workspace"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          <div className="image-list">
            {ws.items.map((i) => (
              <div className={`image-row ${selected === i.id ? 'selected' : ''}`} key={i.id}>
                <button
                  className="image-select"
                  onClick={() => setSelected(selected === i.id ? undefined : i.id)}
                  aria-label={`Inspect ${i.file.name}`}
                  aria-expanded={selected === i.id}
                >
                  <img src={i.url} alt="" />
                  <span>
                    <strong>{i.file.name}</strong>
                    <small>
                      {i.width} × {i.height} <span>·</span> {bytes(i.file.size)} <span>·</span>{' '}
                      {i.format.split('/')[1].toUpperCase()}
                    </small>
                    <span className={`file-status ${i.status === 'error' ? 'error-text' : ''}`}>
                      {i.status === 'done' ? (
                        <>
                          <Check size={12} /> Processed · {bytes(i.result!.blob.size)}
                        </>
                      ) : i.status === 'processing' ? (
                        <>
                          <LoaderCircle size={12} className="spin" /> Processing…
                        </>
                      ) : i.status === 'queued' ? (
                        'Waiting…'
                      ) : i.status === 'error' ? (
                        i.error
                      ) : (
                        `${i.inspection.fields.length} metadata ${i.inspection.fields.length === 1 ? 'field' : 'fields'} detected`
                      )}
                    </span>
                  </span>
                </button>
                <div className="row-actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelected(selected === i.id ? undefined : i.id)}
                    aria-label={`View metadata for ${i.file.name}`}
                  >
                    <ScanLine size={16} />
                  </Button>
                  {i.result ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={`Download ${i.file.name}`}
                      onClick={() => download(i.result!.blob, i.result!.name)}
                    >
                      <Download size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked}
                      onClick={() => void ws.run(options, i.id)}
                    >
                      {i.status === 'error' ? 'Retry' : 'Clean'}
                      <ArrowRight size={13} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={locked}
                    onClick={() => ws.remove(i.id)}
                    aria-label={`Remove ${i.file.name}`}
                  >
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {item && <Inspector key={item.id} item={item} />}
          <OutputSettings options={options} setOptions={setOptions} busy={ws.busy} />
          {ws.busy && (
            <div className="batch-progress" role="status">
              <progress
                aria-label="Images processed"
                max={ws.items.length}
                value={ws.items.filter((i) => i.status === 'done' || i.status === 'error').length}
              />
              <span>
                Processing {ws.items.findIndex((i) => i.status === 'processing') + 1} of{' '}
                {ws.items.length} — cancel stops pending images.
              </span>
            </div>
          )}
          <div className="workspace-bottom">
            <span>
              <LockKeyhole size={13} /> Processed on your device
            </span>
            <div>
              {ws.busy ? (
                <Button variant="secondary" size="sm" onClick={ws.cancel}>
                  <Square size={12} /> Cancel pending
                </Button>
              ) : (
                <>
                  {completed.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked}
                      onClick={() => void zipAll()}
                    >
                      <Download size={14} />
                      {zip !== null ? `Creating ZIP ${Math.round(zip)}%` : 'Download ZIP'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={locked || completed.length === ws.items.length}
                    onClick={() => void ws.run(options)}
                  >
                    <ScanLine size={14} />
                    Clean {ws.items.length > 1 ? 'all images' : 'image'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {ws.errors.length > 0 && (
        <div className="upload-errors" role="alert">
          <AlertCircle size={17} />
          <div>
            {ws.errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
          <button aria-label="Dismiss errors" onClick={() => ws.setErrors([])}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="tool-footnote">
        <span>
          <Check size={12} /> No sign-up. No uploads. Always free.
        </span>
        <span>Made to leave less behind.</span>
      </div>
      <div className="sr-only" aria-live="polite">
        {ws.adding
          ? 'Inspecting images.'
          : ws.busy
            ? 'Processing images.'
            : `${ws.items.length} images. ${completed.length} processed. ${ws.items.filter((i) => i.status === 'error').length} failed.`}
      </div>
    </motion.div>
  );
}
