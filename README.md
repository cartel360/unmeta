# Unmeta

**Your images. Nothing extra.**

Unmeta inspects and removes supported image metadata from JPEG, PNG, and WebP files. Images are processed locally in the browser, with options for format conversion, quality, resizing, and batch downloads.

The application exports as a static website. It requires no backend, database, or accounts.

## Getting started

Requires Node.js 22.12 or newer. Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS, Radix UI, Lucide, and Motion
- exifr for supported EXIF, GPS, XMP, and IPTC extraction
- Canvas, ImageBitmap, and OffscreenCanvas for image processing
- Web Workers for background encoding
- JSZip for batch downloads
- Vitest and Playwright for testing

Geist and Geist Mono are bundled locally. Their licenses are included in `public/licenses/`.

## Project structure

```text
src/
  app/             Pages, layouts, styles, and SEO metadata
  components/      Upload, workspace, inspector, and shared UI
  config/          Site configuration
  hooks/           Workspace state and batch processing
  lib/image/       Validation, container parsing, inspection, encoding, and downloads
  types/           Image and metadata types
  workers/         Background image encoding
scripts/           Static preview server and security header generation
public/            Static assets and hosting header template
tests/             Unit tests and browser integration tests
```

## Image processing

1. Validate the file size, signature bytes, and container dimensions.
2. Inspect supported metadata with exifr and format-specific container parsers.
3. Decode the image, applying EXIF orientation through the browser decoder.
4. Draw the pixels onto a new canvas, preserving the aspect ratio and applying the selected output settings.
5. Encode a new image without copying the original metadata.
6. Inspect the output and compare detected field keys before making it available for download.

Encoding uses a Web Worker and OffscreenCanvas where supported, with a main-thread canvas fallback. Batch processing runs one image at a time to limit peak memory use. Cancelling a batch lets the current image finish and leaves pending images ready to retry.

PNG and WebP outputs preserve transparency. JPEG output uses the selected background color. Resizing never upscales an image. ZIP archives contain processed files only, with duplicate filenames renamed automatically.

Selected files and results remain in browser memory for the session. Removing files or clearing the workspace releases retained references and preview URLs. Images are not uploaded or saved to browser storage.

## Metadata support

| Format | Inspection coverage                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| JPEG   | Supported EXIF/GPS fields, XMP, IPTC, ICC profile indicators, comments, and limited JUMBF/C2PA indicators                      |
| PNG    | Supported EXIF fields, text and international text, compressed text indicators, ICC profiles, and `caBX` credential indicators |
| WebP   | EXIF, XMP, ICC, and C2PA container indicators, plus raw XMP packet text                                                        |

Compressed PNG text contents and detailed WebP metadata fields are not inspected. C2PA indicators identify possible credential containers; they do not validate signatures or provenance. Unknown vendor structures and pixel-based watermarks are outside the inspector's coverage.

Field counts include readable fields and container indicators, which can overlap. A removed field count means a previously detected key is absent from the output. Browser encoders may introduce technical metadata of their own.

## Limits and compatibility

Limits are configured in `src/lib/image/formats.ts`:

| Limit                       | Value                  |
| --------------------------- | ---------------------- |
| Original file size          | 30 MB per image        |
| Pixel count                 | 32 megapixels          |
| Maximum dimension           | 16,384 pixels per side |
| Images per session          | 30                     |
| Combined original file size | 150 MB                 |
| Retained output size        | 200 MB                 |

Only still JPEG, PNG, and WebP images are supported. Animated PNG/WebP, HEIC, GIF, SVG, AVIF, and RAW files are unsupported.

JPEG and WebP re-encoding can reduce quality. PNG preserves canvas pixel values, but browser decoding and color management can change the original colors or profiles. Encoder support and memory limits vary by browser and device; smaller batches or output dimensions help on devices with limited memory.

Output settings apply to images that have not yet been processed. To change a completed image's settings, remove it and add it again.

## Testing

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests run against the static export, including its production security headers, using a local server on port 3100. Build the application before running them. To use an installed Chrome browser, set `PLAYWRIGHT_CHANNEL=chrome`.

The test suite covers file validation, metadata parsing and comparison, output sizing, filenames, worker processing, canvas fallback, EXIF orientation, transparency, downloads, ZIP archives, cancellation, clipboard and drag-and-drop input, workspace reset, responsive navigation, and local-only image processing. Image fixtures are generated in the tests.

Format the source with:

```sh
npm run format
```

## Configuration

Copy `.env.example` to `.env.local` to configure optional values. Public environment variables are read at build time.

| Variable                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Production HTTPS origin for canonical URLs and sitemap entries |
| `NEXT_PUBLIC_GITHUB_URL`    | Repository link in the navigation; hidden when unset           |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact link on the privacy and terms pages; hidden when unset |

Without `NEXT_PUBLIC_SITE_URL`, canonical URLs and sitemap entries are omitted.

## Deployment

```sh
npm run build
```

Deploy the generated `out/` directory to a static hosting provider. No Node.js server is needed in production.

For Cloudflare Pages, configure:

- **Build command:** `npm run build`
- **Output directory:** `out`
- **Node.js version:** 24
- **Environment variables:** the applicable values from the configuration table

Trailing-slash routes export as standalone directories, including `privacy/index.html` and `terms/index.html`.

### Security headers

`public/_headers` supplies the hosting header template. After each build, `scripts/security-headers.mjs` hashes the exported inline scripts and generates `out/_headers` for Cloudflare Pages and Netlify-compatible hosts. Other hosts can configure equivalent response headers.

The production Content Security Policy restricts connections and assets to the site and required local resources. Inline scripts use hashes; inline styles remain enabled for animation styles. Rebuild after changing exported HTML so the hashes stay in sync. Development uses Next.js's development server rather than the production header policy.

## License

Unmeta is licensed under the [ISC License](LICENSE).

Third-party packages retain their respective licenses. See [Third-party notices](THIRD_PARTY_NOTICES.md) for dependency attributions and license texts. Geist and Geist Mono are licensed under the SIL Open Font License 1.1. License files are also included in the static export under `/licenses/`.
