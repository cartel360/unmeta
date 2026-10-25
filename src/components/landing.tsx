import {
  ArrowDown,
  ArrowDownToLine,
  ScanLine,
  Layers,
  Eye,
  Image as ImageIcon,
  UserRound,
  LockKeyhole,
  MousePointer2,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Workspace } from './workspace';
import { FAQ } from './faq';
export function Landing() {
  return (
    <main>
      <section className="hero container" id="tool">

        <div className="hero-copy">
          <div className="privacy-tag">
            <span />
            100% BROWSER-BASED PROCESSING
          </div>
          <h1>
            Your images.
            <br />
            <span>Nothing extra.</span>
          </h1>
          <p>
            Unmeta is a free, privacy-first image metadata cleaner
            that removes EXIF, GPS, C2PA Content Credentials,
            AI generation tags, and Stable Diffusion parameters
            from your images.
          </p>
          <p className="hero-subtext">
            Protect your privacy before you share. Everything
            happens directly in your browser, with no uploads,
            no accounts, and no image storage.
          </p>
          <div className="hero-points">
            <span>
              <LockKeyhole size={14} /> No uploads
            </span>
            <span>
              <UserRound size={14} /> No accounts
            </span>
            <span>
              <Eye size={14} /> Just privacy
            </span>
          </div>
        </div>

        <Workspace />
        <a className="hero-more" href="#how-it-works">
          A cleaner image. A little more peace of mind.
          <ArrowDown size={15} />
        </a>
      </section>
      <section className="trust-strip">
        <div className="container">
          <span>
            <LockKeyhole size={17} /> Your files never leave your browser
          </span>
          <span>
            <Layers size={17} /> Batch processing, built in
          </span>
          <span>
            <ImageIcon size={17} /> JPEG, PNG & WebP
          </span>
        </div>
      </section>
      <section className="section container" id="how-it-works">
        <div className="section-heading">
          <div>
            <h2>A fresh start for every image.</h2>
          </div>
          <p>
            No installation. No upload progress bar.
            <br />
            Just your image, with less attached.
          </p>
        </div>
        <div className="steps">
          {[
            {
              n: '01',
              icon: MousePointer2,
              title: 'Choose your image.',
              text: 'Drop in an image, browse your files, or paste straight from your clipboard.',
            },
            {
              n: '02',
              icon: ScanLine,
              title: 'Remove metadata.',
              text: 'Inspect hidden details, choose your settings, and create a freshly encoded copy.',
            },
            {
              n: '03',
              icon: ArrowDownToLine,
              title: 'Download privately.',
              text: 'Download your cleaned images. Individually or all together in one tidy ZIP.',
            },
          ].map((s) => (
            <article className="step" key={s.n}>
              <div className="step-top">
                <span>{s.n}</span>
                <s.icon size={24} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section features container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SMALL TOOL. THOUGHTFUL DETAILS.</span>
            <h2>
              Keep your memories.
              <br />
              Keep your privacy, too.
            </h2>
          </div>
          <p>
            Everything you need to share a little less.
            <br />
            Nothing to get in your way.
          </p>
        </div>
        <div className="bento">
          <article className="privacy-feature">
            <div className="local-diagram">
              <span>
                <ImageIcon size={26} />
              </span>
              <div className="diagram-line" />
              <span>
                <LockKeyhole size={25} />
              </span>
              <div className="diagram-line" />
              <span>
                <ArrowDownToLine size={25} />
              </span>
              <div className="diagram-caption">
                YOUR DEVICE <span>→</span> YOUR DEVICE
              </div>
            </div>
            <div>
              <h3>Private by design.</h3>
              <p>
                Your images stay with you. All processing happens in your browser, with no server
                uploads or saved image history.
              </p>
              <Link href="/privacy/">
                Read our privacy promise <ArrowUpRight size={15} />
              </Link>
            </div>
          </article>

          <article className="feature">
            <ScanLine />
            <h3>Hidden, now visible.</h3>
            <p>
              Inspect EXIF, GPS, AI generation tags, Stable Diffusion
              parameters, and other supported image metadata
              before cleaning.
            </p>
          </article>

          <article className="feature">
            <Layers />
            <h3>A whole batch. Less effort.</h3>
            <p>Clean multiple images and download a single ZIP.</p>
          </article>
          <article className="feature compact">
            <ImageIcon />
            <div>
              <h3>Your format. Your choice.</h3>
              <p>JPEG, PNG, or WebP. You’re in control.</p>
            </div>
            <span className="format-label">JPG · PNG · WEBP</span>
          </article>
          <article className="feature compact">
            <UserRound />
            <div>
              <h3>Open. Drop. Done.</h3>
              <p>No account, no installation, no waiting for uploads.</p>
            </div>
          </article>
        </div>
      </section>
      <FAQ />
      <div className="closing container">
        <span className="status-dot" /> A little less metadata. A lot more yours.
      </div>
    </main>
  );
}
