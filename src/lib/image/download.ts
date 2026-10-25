import type { ImageItem } from '@/types/image';
import { uniqueName } from './formats';
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function downloadZip(items: ImageItem[], progress: (n: number) => void) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip(),
    used = new Set<string>();
  for (const item of items)
    if (item.result) zip.file(uniqueName(item.result.name, used), item.result.blob);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, (m) =>
    progress(m.percent),
  );
  download(blob, 'unmeta-clean-images.zip');
}
