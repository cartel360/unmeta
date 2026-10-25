export type Format = 'image/jpeg' | 'image/png' | 'image/webp';
export type Options = {
  format: Format | 'original';
  quality: number;
  maxDimension: number;
  background: string;
};
export type Field = { key: string; category: string; value: string };
export type Inspection = { fields: Field[]; notes: string[]; checked: string[] };
export type Result = {
  blob: Blob;
  url: string;
  inspection: Inspection;
  width: number;
  height: number;
  duration: number;
  removed: number;
  name: string;
};
export type ImageItem = {
  id: string;
  file: File;
  url: string;
  format: Format;
  width: number;
  height: number;
  inspection: Inspection;
  status: 'ready' | 'queued' | 'processing' | 'done' | 'error';
  error?: string;
  result?: Result;
};
