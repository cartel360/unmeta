import { encodeOffscreen } from '../lib/image/encode';
import type { Format, Options } from '../types/image';
self.onmessage = async (event: MessageEvent<{ file: Blob; format: Format; options: Options }>) => {
  try {
    self.postMessage({
      ok: true,
      ...(await encodeOffscreen(event.data.file, event.data.format, event.data.options)),
    });
  } catch {
    self.postMessage({ ok: false });
  }
};
