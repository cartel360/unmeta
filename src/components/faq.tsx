'use client';
import * as Accordion from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
const questions = [
  [
    'What is image metadata?',
    'Metadata is information stored alongside an image’s pixels. It can include camera settings, capture dates, GPS location, editing software, copyright information, and AI generation prompts.',
  ],
  [
    'Does Unmeta upload my images?',
    'No. Inspection, image processing, and ZIP creation run in your browser. Unmeta has no image upload endpoint, account system, or analytics scripts. Your browser still requests the website’s own static files.',
  ],
  [
    'Can Unmeta remove AI-generated image metadata?',
    'It creates a new image from decoded pixels without intentionally copying embedded EXIF, XMP, IPTC, PNG text, or generator prompts. The inspector can show supported fields and credential container indicators. It does not validate C2PA signatures or guarantee detection of every metadata type.',
  ],
  [
    'Does this make an AI image undetectable?',
    'No. Embedded metadata, cryptographic provenance credentials, and invisible pixel-based watermarks are different things. Re-encoding does not reliably remove pixel-based watermarks or change the visual evidence used by AI detectors.',
  ],
  [
    'Will cleaning reduce image quality?',
    'JPEG and WebP re-encoding can reduce quality. PNG encoding preserves the canvas pixels, but decoding may change color profiles or color rendering. Format conversion can also change size and transparency. You control the output format, quality, and dimensions.',
  ],
  [
    'Can I process multiple images?',
    'Yes. Add up to 30 images with a combined original size of 150 MB, clean them as a batch, and download successful results in a ZIP. Images run one at a time to keep memory usage under control. Cancel stops pending images after the current image finishes.',
  ],
  [
    'Which image formats are supported?',
    'Still JPEG, PNG, and WebP images, up to 30 MB each, 32 megapixels, and 16,384 pixels on either side. Animated images are rejected so animation is not silently lost. HEIC, GIF, AVIF, SVG, and RAW files are not supported.',
  ],
  [
    'Is Unmeta free?',
    'Yes. There are no accounts, subscriptions, or usage charges in the application. Processing is limited by your browser and device memory.',
  ],
  [
    'Does Unmeta store my images?',
    'Files and temporary results stay in browser memory during your session. The application does not save them to cookies, localStorage, sessionStorage, IndexedDB, or a server. Clearing the workspace releases its image references; browser and operating-system memory management remain outside the application’s control.',
  ],
  [
    'Can removed metadata be recovered?',
    'Metadata that was not copied into a new file cannot be recovered from that file by simply inspecting its embedded fields. The original file still has its original metadata, and information may remain in visible pixels, uninspected structures, or copies elsewhere. Only share the downloaded output.',
  ],
];
export function FAQ() {
  return (
    <section id="faq" className="faq-section section container">
      <div>
        <h2>
          Good questions.
          <br />
          Straight answers.
        </h2>
        <p className="muted">Privacy starts with knowing what’s happening.</p>
      </div>
      <Accordion.Root type="single" collapsible className="faq-list">
        {questions.map(([q, a], i) => (
          <Accordion.Item key={q} value={String(i)} className="faq-item">
            <Accordion.Header>
              <Accordion.Trigger className="faq-trigger">
                {q}
                <Plus size={18} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="faq-content">
              <p>{a}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
