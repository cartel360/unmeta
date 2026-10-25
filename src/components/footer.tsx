import Link from 'next/link';
import { Brand } from './brand';
export function Footer() {
  return (
    <footer className="footer container">
      <div className="footer-top">
        <div>
          <Brand />
          <p>Your images. Nothing extra.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#tool">The tool</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/privacy/">Privacy</Link>
          <Link href="/terms/">Terms</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Unmeta</span>
        <span>Built for your browser. Designed for your privacy.</span>
      </div>
    </footer>
  );
}
