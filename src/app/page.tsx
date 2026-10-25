import type { Metadata } from 'next';
import { Landing } from '@/components/landing';
import { site } from '@/config/site';
export const metadata: Metadata = { alternates: site.url ? { canonical: site.url } : undefined };
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Unmeta',
            description: 'Inspect and remove supported image metadata locally in your browser.',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires a modern browser with JavaScript enabled',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            ...(site.url ? { url: site.url } : {}),
          }),
        }}
      />
      <Landing />
    </>
  );
}
