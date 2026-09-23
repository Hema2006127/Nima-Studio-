import Link from 'next/link';

/** Studio logo mark + name, used in every header. */
export function Logo({ name, href = '/', size = 40, subtitle }: { name: string; href?: string; size?: number; subtitle?: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3 text-ink">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static asset */}
      <img
        src="/logo-240.jpg"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
      <span className="min-w-0">
        <span className="block truncate font-display text-2xl leading-tight">{name}</span>
        {subtitle}
      </span>
    </Link>
  );
}
