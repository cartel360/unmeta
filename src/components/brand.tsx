import Link from 'next/link';
export function Mark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M6 7h20v15H6z" stroke="currentColor" strokeWidth="2" />
      <path
        d="m10 18 5-5 5 5M20 13h2M10 26h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="m4 28 24-24" stroke="var(--bg)" strokeWidth="6" />
      <path d="m4 28 24-24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Unmeta home">
      <span className="brand-mark">
        <Mark />
      </span>
      unmeta<span className="brand-dot">.</span>
    </Link>
  );
}
