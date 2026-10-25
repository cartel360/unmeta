import type { Metadata } from 'next';
import { site } from '@/config/site';
export const metadata: Metadata = {
  title: 'Privacy',
  alternates: site.url ? { canonical: `${site.url}/privacy/` } : undefined,
};
export default function Privacy() {
  return (
    <main className="legal container">
      <span className="eyebrow">YOUR FILES. YOUR BUSINESS.</span>
      <h1>Privacy, by design.</h1>
      <p className="intro">
        Unmeta processes your images locally. We built it to work without receiving them.
      </p>
      <h2>What happens to your images</h2>
      <p>
        Image inspection, decoding, re-encoding, verification, and ZIP generation happen in your
        browser. The application has no image upload endpoint and does not send your images or their
        metadata to external services. No account is required.
      </p>
      <h2>Temporary browser memory</h2>
      <p>
        Your selected files, previews, and processed outputs exist in memory for the current
        session. Unmeta does not save image data in cookies, localStorage, sessionStorage, or
        IndexedDB. Removing an image, clearing the workspace, or leaving the page releases
        application references and object URLs. Browser and operating-system memory handling, swap,
        extensions, and downloaded files are outside the application’s direct control.
      </p>
      <h2>Website requests and hosting</h2>
      <p>
        Your browser requests the static website files from the hosting provider. That provider may
        receive standard connection information such as IP addresses, request times, browser
        headers, and requested URLs, according to its own policies. These requests do not contain
        images selected through the application. Unmeta includes no advertising, analytics,
        third-party tracking scripts, or error-reporting services.
      </p>
      <h2>Downloads and sharing</h2>
      <p>
        Downloads are saved where your browser places them. The original image is unchanged. Only
        share the processed output if you want to avoid sharing the original embedded metadata.
        Browser encoders may add technical information, and the inspector cannot detect all possible
        metadata or pixel-based watermarks.
      </p>
      <h2>Your control</h2>
      <p>
        You can remove individual files or clear the workspace at any time when processing is idle.
        Cancel pending work to stop a batch after its current image finishes. Refreshing the page
        starts a new, empty session.
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
