import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/config/site';
export const metadata: Metadata = {
  title: 'Terms',
  alternates: site.url ? { canonical: `${site.url}/terms/` } : undefined,
};
export default function Terms() {
  return (
    <main className="legal container">
      <span className="eyebrow">THE DETAILS, IN PLAIN LANGUAGE.</span>
      <h1>Terms of use.</h1>
      <p className="intro">
        Unmeta is a free browser-based utility for inspecting and removing supported embedded image
        metadata.
      </p>
      <h2>Using the tool</h2>
      <p>
        Use Unmeta only with images you are authorized to process. You remain responsible for your
        files, permissions, use of the output, and any applicable obligations relating to
        attribution, copyright, or provenance. Unmeta does not take ownership of your images.
      </p>
      <h2>Processing and accuracy</h2>
      <p>
        Unmeta decodes and re-encodes still JPEG, PNG, and WebP images without intentionally copying
        their embedded metadata. Inspection is limited to implemented parsers and container checks.
        Field counts may include both container indicators and individual fields. No guarantee is
        made that all metadata is detected or removed. C2PA indicators are not credential
        validation. Pixel-based watermarks and AI detection are outside the tool’s scope.
      </p>
      <h2>Image changes</h2>
      <p>
        Re-encoding can change file size, quality, color rendering, profiles, and transparency. JPEG
        and WebP can lose detail. PNG output preserves canvas pixel values but does not guarantee a
        pixel-identical match to the original decoded source. Keep your originals and verify results
        before relying on them.
      </p>
      <h2>Availability and responsibility</h2>
      <p>
        The tool is provided as available, without promises of uninterrupted operation,
        compatibility with every browser, or fitness for a particular purpose, to the extent
        permitted by applicable law. Your device and browser determine available memory and
        supported encoders. Nothing here excludes rights or responsibilities that cannot lawfully be
        excluded.
      </p>
      <h2>Privacy</h2>
      <p>
        All image processing is local to your browser. Read the{' '}
        <Link href="/privacy/">privacy page</Link> for details of temporary memory, website hosting
        requests, and downloads.
      </p>
      {site.contact && (
        <>
          <h2>Contact</h2>
          <p>
            <a href={`mailto:${site.contact}`}>{site.contact}</a>
          </p>
        </>
      )}
    </main>
  );
}
