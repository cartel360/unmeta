# Unmeta

A static, browser-only image metadata inspector and remover. Built with Next.js App Router, strict TypeScript, Tailwind CSS, shadcn-style owned components backed by Radix, Lucide, Motion, exifr, and JSZip. Dark by default, with a light theme and responsive workspace.

## Develop

Requires Node.js 22.12 or newer (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Images never leave the browser through the application. No API routes, server actions, database, authentication, analytics, remote fonts, or image persistence.

## Validate

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright launches a local static-file QA server on port 3100, using the exported `out/` files and their real production CSP headers. Build before running browser tests. Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome instead of a downloaded Chromium. Tests cover PNG text inspection/removal, actual worker success, real output decoding, JPEG/WebP conversion, transparency backgrounds, EXIF orientation, resizing, main-thread fallback, individual downloads, batches and ZIP naming, cancellation, reset, paste/drop input, invalid files, mobile navigation/layout, light mode, and legal routes. Unit tests cover signatures, size/dimension limits, PNG/JPEG/WebP containers, output sizing, filenames, verification comparisons, and cancellation state. Fixtures are generated in test code with valid PNG CRCs rather than including private photos.

## How processing works

1. Check file size and inspect signature bytes rather than trusting extension/MIME.
2. Parse container dimensions before allocating decoded pixel buffers. Reject animation and excessive dimensions.
3. Read supported metadata using exifr and lightweight PNG/JPEG/WebP container parsers.
4. Decode with `createImageBitmap({imageOrientation: 'from-image'})`, falling back to the browser image decoder.
5. Draw into a new canvas, preserving aspect ratio. PNG/WebP keep alpha; JPEG receives the chosen background. Resize only when selected, without upscaling.
6. Encode in an isolated Worker with OffscreenCanvas where supported, or fall back to a main-thread canvas. A failed worker is terminated before fallback. Encoders unsupported by the browser fail explicitly.
7. Inspect the generated Blob again, compare actual detected field keys, and provide a local object URL for download.

Batch concurrency is **one** to bound peak decoding memory. Cancel finishes the active image and leaves pending files ready to retry. Repeated actions are guarded synchronously. Originals are unchanged. ZIPs contain successful outputs only; duplicate filenames are renamed case-insensitively. ImageBitmap resources are closed, worker instances terminated, canvases cleared, and preview URLs revoked on removal/reset/unmount. Download URLs expire after 30 seconds.

Limits are configured in `src/lib/image/formats.ts`: 30 MB per original, 32 megapixels, 16,384 pixels per dimension, 30 images and 150 MB of original files per session. Retained result Blobs are limited to a combined 200 MB. Result Blobs also consume device memory. Use smaller batches or resize on memory-constrained devices. The main-thread fallback may briefly pause the interface on large images.

## Inspection coverage and limits

- exifr: supported TIFF/EXIF/GPS, XMP and IPTC readable fields. Parse failures are explicitly reported.
- JPEG: EXIF and XMP APP1 segments, Photoshop/IPTC APP13 indicators, ICC APP2 indicators, comments, and limited APP11 JUMBF/C2PA indicators.
- PNG: uncompressed text and international text, compressed text presence, EXIF, ICC, and `caBX` credential indicators. Compressed text contents are **not checked**. PNG text exposes generator prompts where stored as readable text. CRC integrity is ultimately subject to browser decoding; this is not a forensic validator.
- WebP: EXIF, XMP, ICC, C2PA chunk indicators; XMP packet text. Detailed WebP EXIF parsing may be unavailable in exifr and is reported when parsing throws.
- Image dimensions and output encoding are displayed separately from embedded metadata.

Counts include both container indicators and readable fields and can overlap. A removed field count means previously detected keys are absent after processing, not proof that all metadata was removed. New encoder metadata may remain. Detailed metadata values are truncated for display. Unknown/private structures, compressed text contents, invisible pixel watermarks, and full C2PA signature validation are not inspected. Re-encoding does not make AI imagery undetectable. Embedded credentials can be discarded by re-encoding; provenance is not validated.

JPEG/WebP re-encoding is lossy. PNG preserves canvas values, not necessarily original color values or profiles. Browser decoders handle EXIF orientation; color management and encoder metadata vary by browser. Animated PNG/WebP, HEIC, GIF, SVG, AVIF, and RAW are unsupported. Settings apply only to files not yet processed; remove and re-add a processed file to change its output settings. Clearing releases application references, but browser/OS memory handling is outside application control.

## Production and static hosting

Copy `.env.example` to `.env.local` if needed. Set `NEXT_PUBLIC_SITE_URL` to your real HTTPS origin at **build time** to enable canonical URLs and sitemap entries. Without it, no domain is invented and the sitemap has no entries. Optionally configure a real GitHub URL and contact email; their links are otherwise hidden. Only use trusted values. Fonts are bundled locally.

```sh
npm run build
```

Deploy the generated **`out/`** directory to any static host. No Node server is required in production. With Cloudflare Pages, use `npm run build` as the build command and `out` as the output directory. Configure the environment variables in the build settings and use a supported Node version. Trailing-slash routes produce standalone `privacy/index.html` and `terms/index.html` pages.

`public/_headers` is exported for Cloudflare Pages/Netlify-compatible hosts. Other hosts must configure equivalent response headers. CSP blocks remote connections, objects and form submissions, restricts workers and images, and prevents framing. The postbuild script hashes the exported inline hydration/structured-data scripts and writes a CSP without script `unsafe-inline` or `unsafe-eval`. Motion inline styles still require style `unsafe-inline`. Rebuild after any HTML changes so the hashes remain current. `public/_headers` is the source template; deploy the generated `out/_headers`. The production CSP is intentionally not applied to Next's development server, which requires development tooling connections.

Do not add upload endpoints, third-party telemetry, or persistent image storage without revising the privacy promise. The repository includes no secrets or invented legal entity/contact details.
