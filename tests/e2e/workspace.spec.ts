import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
function crc32(b: Buffer) {
  let c = 0xffffffff;
  for (const n of b) {
    c ^= n;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function metadataPNG() {
  function chunk(type: string, data: Buffer) {
    const t = Buffer.from(type),
      b = Buffer.alloc(data.length + 12);
    b.writeUInt32BE(data.length);
    t.copy(b, 4);
    data.copy(b, 8);
    b.writeUInt32BE(crc32(Buffer.concat([t, data])), data.length + 8);
    return b;
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('tEXt', Buffer.from('Artist\0Private Author')),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 255, 0, 0, 255, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
test('inspect, clean, verify and download without uploading', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    class ObservedWorker extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', (event) => {
          if (event.data?.ok)
            (window as unknown as Record<string, unknown>).__unmetaWorkerSucceeded = true;
        });
      }
    }
    Object.defineProperty(window, 'Worker', { value: ObservedWorker });
  });

  const posts: string[] = [];
  const requests: string[] = [];
  page.on('request', (r) => {
    if (!['GET', 'HEAD'].includes(r.method()))
      posts.push(`${r.method()} ${r.url()} (${r.postData()?.length ?? 0} body bytes)`);
    if (r.url().startsWith('http')) requests.push(r.url());
  });
  await page.goto('/');
  await page
    .getByLabel('Upload image files', { exact: true })
    .setInputFiles({ name: 'private.png', mimeType: 'image/png', buffer: metadataPNG() });
  await page.getByRole('button', { name: 'Inspect private.png', exact: true }).click();
  await expect(page.getByText('Private Author', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clean image', exact: true }).click();
  await expect(page.getByText('Image processed successfully.')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'After', exact: true }).click();
  await expect(page.getByText('Private Author', { exact: true })).not.toBeVisible();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private.png', exact: true }).click();
  const dl = await promise;
  expect(dl.suggestedFilename()).toBe('private-clean.png');
  const path = await dl.path();
  const output = await readFile(path!);
  expect(output.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(output.includes(Buffer.from('Private Author'))).toBe(false);
  await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('img[alt="Cleaned private.png"]')!;
    await img.decode();
    if (img.naturalWidth !== 2) throw new Error('Invalid output');
  });
  expect(posts).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__unmetaWorkerSucceeded,
    ),
  ).toBe(true);
  for (const request of requests) {
    const url = new URL(request);
    expect(url.origin).toBe('http://127.0.0.1:3100');
    expect(url.pathname).toMatch(
      /^\/(?:$|_next\/|__next\.[^/]+\.txt$|icon\.svg|favicon\.ico|privacy\/|terms\/)/,
    );
    expect(decodeURIComponent(url.href)).not.toContain('Private Author');
    expect(url.href).not.toContain('private.png');
  }
  await page.getByRole('button', { name: 'Clear workspace' }).click();
  await expect(page.getByRole('button', { name: 'Choose images', exact: true })).toBeVisible();
});
test('batch ZIP contains only unique cleaned images', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Upload image files', { exact: true }).setInputFiles([
    { name: 'same.png', mimeType: 'image/png', buffer: metadataPNG() },
    { name: 'same.png', mimeType: 'image/png', buffer: metadataPNG() },
  ]);
  await page.getByRole('button', { name: 'Clean all images', exact: true }).click();
  await expect(page.getByText('2 processed · Ready to download')).toBeVisible({ timeout: 30000 });
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download ZIP', exact: true }).click();
  const dl = await promise;
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await readFile((await dl.path())!));
  expect(Object.keys(zip.files)).toEqual(['same-clean.png', 'same-clean-2.png']);
  for (const f of Object.values(zip.files))
    expect((await f.async('nodebuffer')).includes(Buffer.from('Private Author'))).toBe(false);
});
test('invalid files fail gracefully and mobile controls fit', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose images', exact: true })).toBeInViewport();
  await page
    .getByLabel('Upload image files', { exact: true })
    .setInputFiles({ name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake image') });
  await expect(page.getByRole('alert').filter({ hasText: 'Unsupported file' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose images', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }).getByText('FAQ'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
test('desktop landing and legal pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your images.');
  await expect(page.locator('.tool-shell')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: 'Choose images', exact: true })).toBeInViewport();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Terms');
});
test('JPEG conversion, resizing and main-thread fallback preserve orientation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Worker', { value: undefined, configurable: true });
  });
  await page.goto('/');
  const jpeg = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 800;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, 800, 800);
    ctx.fillStyle = '#00f';
    ctx.fillRect(800, 0, 800, 800);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 1));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  const exif = Buffer.from([
    0xff, 0xe1, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 1, 3, 0, 1,
    0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const oriented = Buffer.concat([Buffer.from(jpeg.slice(0, 2)), exif, Buffer.from(jpeg.slice(2))]);
  await page
    .getByLabel('Upload image files', { exact: true })
    .setInputFiles({ name: 'oriented.jpg', mimeType: 'image/jpeg', buffer: oriented });
  await page.getByRole('button', { name: /Output settings/ }).click();
  await page
    .getByRole('combobox', { name: 'Output format', exact: true })
    .selectOption('image/png');
  await page
    .getByRole('combobox', { name: 'Resize longest edge', exact: true })
    .selectOption('800');
  await page.getByRole('button', { name: 'Clean image', exact: true }).click();
  await expect(page.getByText('1 processed · Ready to download')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Inspect oriented.jpg', exact: true }).click();
  await expect(page.getByText('Image processed successfully.')).toBeVisible();
  const pixels = await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('img[alt="Cleaned oriented.jpg"]')!;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return {
      width: c.width,
      height: c.height,
      top: [...ctx.getImageData(200, 100, 1, 1).data],
      bottom: [...ctx.getImageData(200, 700, 1, 1).data],
    };
  });
  expect(pixels.width).toBe(400);
  expect(pixels.height).toBe(800);
  expect(pixels.top[0]).toBeGreaterThan(240);
  expect(pixels.bottom[2]).toBeGreaterThan(240);
});
test('WebP output preserves transparency', async ({ page }) => {
  await page.goto('/');
  await page
    .getByLabel('Upload image files', { exact: true })
    .setInputFiles({ name: 'alpha.png', mimeType: 'image/png', buffer: metadataPNG() });
  await page.getByRole('button', { name: /Output settings/ }).click();
  await page
    .getByRole('combobox', { name: 'Output format', exact: true })
    .selectOption('image/webp');
  await page.getByRole('button', { name: 'Clean image', exact: true }).click();
  await expect(page.getByText('1 processed · Ready to download')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Inspect alpha.png', exact: true }).click();
  const alpha = await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('img[alt="Cleaned alpha.png"]')!;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 1;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(1, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(0);
});
test('cancel leaves pending files ready and individual removal works', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    class DelayedWorker extends NativeWorker {
      postMessage(message: unknown) {
        setTimeout(() => super.postMessage(message), 500);
      }
    }
    Object.defineProperty(window, 'Worker', { value: DelayedWorker });
  });
  await page.goto('/');
  await page.getByLabel('Upload image files', { exact: true }).setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: `batch-${i}.png`,
      mimeType: 'image/png',
      buffer: metadataPNG(),
    })),
  );
  await page.getByRole('button', { name: 'Clean all images', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel pending', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Clean all images', exact: true })).toBeEnabled({
    timeout: 30000,
  });
  await expect(page.getByText('1 processed · Ready to download')).toBeVisible();
  await page.getByRole('button', { name: 'Remove batch-5.png', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Inspect batch-5.png', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Clear workspace' }).click();
  await expect(page.getByRole('button', { name: 'Choose images', exact: true })).toBeVisible();
});

test('JPEG output uses the configured transparency background', async ({ page }) => {
  await page.goto('/');
  const transparent = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 8;
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Upload image files', { exact: true }).setInputFiles({
    name: 'transparent.png',
    mimeType: 'image/png',
    buffer: Buffer.from(transparent, 'base64'),
  });
  await page.getByRole('button', { name: /Output settings/ }).click();
  await page
    .getByRole('combobox', { name: 'Output format', exact: true })
    .selectOption('image/jpeg');
  await page.getByLabel('JPEG background', { exact: true }).fill('#112233');
  await page.getByRole('button', { name: 'Clean image', exact: true }).click();
  await expect(page.getByText('1 processed · Ready to download')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Inspect transparent.png', exact: true }).click();
  const rgba = await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('img[alt="Cleaned transparent.png"]')!;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return [...ctx.getImageData(5, 5, 1, 1).data];
  });
  expect(rgba[0]).toBeGreaterThanOrEqual(13);
  expect(rgba[0]).toBeLessThanOrEqual(21);
  expect(rgba[1]).toBeGreaterThanOrEqual(30);
  expect(rgba[1]).toBeLessThanOrEqual(38);
  expect(rgba[2]).toBeGreaterThanOrEqual(47);
  expect(rgba[2]).toBeLessThanOrEqual(55);
  expect(rgba[3]).toBe(255);
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download transparent.png', exact: true }).click();
  expect((await promise).suggestedFilename()).toBe('transparent-clean.jpg');
});

test('clipboard paste and file drop both populate the workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tool-shell')).toHaveCSS('opacity', '1');
  await page.evaluate(
    (bytes) => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], 'pasted.png', { type: 'image/png' }));
      document.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
      );
    },
    [...metadataPNG()],
  );
  await expect(page.getByRole('button', { name: 'Inspect pasted.png', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear workspace' }).click();
  await page.evaluate(
    (bytes) => {
      const data = new DataTransfer();
      data.items.add(new File([new Uint8Array(bytes)], 'dropped.png', { type: 'image/png' }));
      document
        .querySelector('.dropzone')!
        .dispatchEvent(
          new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }),
        );
    },
    [...metadataPNG()],
  );
  await expect(
    page.getByRole('button', { name: 'Inspect dropped.png', exact: true }),
  ).toBeVisible();
});
