'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageItem, Options } from '@/types/image';
import { MAX_FILES, MAX_SESSION_BYTES, MAX_RESULT_BYTES } from '@/lib/image/formats';
import { validateFile } from '@/lib/image/validate';
import { cleanImage } from '@/lib/image/clean';
export function queuedAfterCancel(status: ImageItem['status']): ImageItem['status'] {
  return status === 'queued' ? 'ready' : status;
}
function release(item: ImageItem) {
  URL.revokeObjectURL(item.url);
  if (item.result) URL.revokeObjectURL(item.result.url);
}
export function useWorkspace() {
  const [items, setItems] = useState<ImageItem[]>([]),
    [errors, setErrors] = useState<string[]>([]),
    [adding, setAdding] = useState(false),
    [busy, setBusy] = useState(false);
  const ref = useRef<ImageItem[]>([]),
    cancel = useRef(false),
    addingRef = useRef(false),
    busyRef = useRef(false),
    mounted = useRef(true);
  const commit = useCallback((fn: (v: ImageItem[]) => ImageItem[]) => {
    ref.current = fn(ref.current);
    if (mounted.current) setItems(ref.current);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel.current = true;
      ref.current.forEach(release);
      ref.current = [];
    };
  }, []);
  async function add(files: File[]) {
    if (addingRef.current || busyRef.current) return;
    addingRef.current = true;
    setAdding(true);
    setErrors([]);
    const messages: string[] = [];
    try {
      for (const file of files) {
        if (!mounted.current) break;
        if (ref.current.length >= MAX_FILES) {
          messages.push('A session supports up to 30 images.');
          break;
        }
        if (ref.current.reduce((s, i) => s + i.file.size, 0) + file.size > MAX_SESSION_BYTES) {
          messages.push('Session limit reached (150 MB of originals). Clear images to add more.');
          break;
        }
        try {
          const item = await validateFile(file);
          if (!mounted.current) {
            release(item);
            break;
          }
          commit((v) => [...v, item]);
        } catch (e) {
          messages.push(
            `${file.name}: ${e instanceof Error ? e.message : 'Unable to inspect this file.'}`,
          );
        }
      }
    } finally {
      addingRef.current = false;
      if (mounted.current) {
        setAdding(false);
        setErrors(messages);
      }
    }
  }
  async function run(options: Options, id?: string) {
    if (busyRef.current || addingRef.current) return;
    const targets = ref.current.filter((i) => (!id || i.id === id) && i.status !== 'done');
    if (!targets.length) return;
    busyRef.current = true;
    cancel.current = false;
    setBusy(true);
    const ids = new Set(targets.map((i) => i.id));
    commit((v) => v.map((i) => (ids.has(i.id) ? { ...i, status: 'queued', error: undefined } : i)));
    try {
      for (const item of targets) {
        if (cancel.current || !mounted.current) break;
        commit((v) => v.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i)));
        try {
          await new Promise((r) => setTimeout(r, 0));
          const result = await cleanImage(item, options);
          if (
            ref.current.reduce((sum, i) => sum + (i.result?.blob.size ?? 0), 0) + result.blob.size >
            MAX_RESULT_BYTES
          ) {
            URL.revokeObjectURL(result.url);
            throw new Error(
              'Cleaned results exceed the 200 MB session budget. Download and clear this batch, or choose smaller dimensions.',
            );
          }
          if (!mounted.current) {
            URL.revokeObjectURL(result.url);
            break;
          }
          commit((v) => v.map((i) => (i.id === item.id ? { ...i, result, status: 'done' } : i)));
        } catch (e) {
          if (mounted.current)
            commit((v) =>
              v.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: 'error',
                      error:
                        e instanceof Error
                          ? e.message
                          : 'Processing failed. Try a smaller output size.',
                    }
                  : i,
              ),
            );
        }
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) {
        commit((v) => v.map((i) => ({ ...i, status: queuedAfterCancel(i.status) })));
        setBusy(false);
      }
    }
  }
  function remove(id: string) {
    if (busyRef.current || addingRef.current) return;
    commit((v) =>
      v.filter((i) => {
        if (i.id === id) {
          release(i);
          return false;
        }
        return true;
      }),
    );
  }
  function clear() {
    if (busyRef.current || addingRef.current) return;
    ref.current.forEach(release);
    commit(() => []);
    setErrors([]);
  }
  return {
    items,
    errors,
    setErrors,
    adding,
    busy,
    add,
    run,
    remove,
    clear,
    cancel: () => {
      cancel.current = true;
    },
  };
}
