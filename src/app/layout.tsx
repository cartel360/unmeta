import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { site } from '@/config/site';
const description =
  'Remove EXIF and other supported image metadata instantly with Unmeta. Clean JPEG, PNG, and WebP images privately in your browser. No uploads or accounts required.';
export const metadata: Metadata = {
  metadataBase: site.url ? new URL(site.url) : undefined,
  title: { default: 'Unmeta | Free Image Metadata Remover', template: '%s | Unmeta' },
  description,
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Unmeta — Your images. Nothing extra.',
    description,
    type: 'website',
    siteName: 'Unmeta',
    ...(site.url ? { url: site.url } : {}),
  },
  twitter: { card: 'summary', title: 'Unmeta — Your images. Nothing extra.', description },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c0c0f' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <a className="sr-only focus:not-sr-only" href="#main-content">
          Skip to content
        </a>
        <Navigation />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
