import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="legal container">
      <span className="eyebrow">404</span>
      <h1>Nothing here.</h1>
      <p>
        This page could not be found. <Link href="/">Return to Unmeta</Link> to inspect and clean an
        image.
      </p>
    </main>
  );
}
