'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string; exact?: boolean } | { divider: true };

export function SideNav({ links, className = '' }: { links: Item[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {links.map((item, i) => {
        if ('divider' in item) return <hr key={`d${i}`} className="my-3 hidden border-line lg:block" />;
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-soft text-ink' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
