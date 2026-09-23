'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, MenuIcon } from './icons';

type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ links, className }: { links: NavLink[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? 'page' : undefined}
          className={`border-b pb-0.5 text-sm transition-colors ${
            isActive(pathname, l.href) ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileMenu({
  links,
  bookLabel,
  menuLabel,
  closeLabel,
  themeToggle,
}: {
  links: NavLink[];
  bookLabel: string;
  menuLabel: string;
  closeLabel: string;
  themeToggle: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={menuLabel} aria-expanded={open} className="p-1 text-ink">
        <MenuIcon size={22} />
      </button>
      {/* Portal to <body>: the header's backdrop-blur would otherwise trap this fixed overlay inside it. */}
      {open &&
        createPortal(
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg text-ink" role="dialog" aria-modal="true">
          <div className="container-x flex h-16 items-center justify-between border-b border-line">
            {themeToggle}
            <button type="button" onClick={() => setOpen(false)} aria-label={closeLabel} className="p-1 text-ink">
              <CloseIcon size={22} />
            </button>
          </div>
          <nav className="container-x flex flex-1 flex-col gap-1 py-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                className={`border-b border-line py-4 font-display text-3xl ${isActive(pathname, l.href) ? 'text-accent' : 'text-ink'}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/book" className="btn-primary mt-8 w-full">
              {bookLabel}
            </Link>
          </nav>
        </div>,
          document.body,
        )}
    </>
  );
}
