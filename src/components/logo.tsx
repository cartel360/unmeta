
import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export function Logo({
  width = 170,
  height = 52,
  className = '',
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Unmeta home"
      className={`brand-logo ${className}`}
    >
      <Image
        src="/logo-dark.png"
        alt="Unmeta"
        width={width}
        height={height}
        className="brand-logo-dark"
        priority
      />
      <Image
        src="/logo-light.png"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        className="brand-logo-light"
        priority
      />
    </Link>
  );
}
