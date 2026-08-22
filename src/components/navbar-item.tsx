'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type NavbarItemProps = {
  href: string;
  children: React.ReactNode;
};

export const NavbarItem = ({ href, children }: NavbarItemProps) => {
  const pathname = usePathname();

  const isActive = checkIsActive(href, pathname);

  return (
    <Link
      href={href}
      className={cn(
        'text-muted-foreground hover:text-primary text-sm font-medium transition-colors',
        isActive && 'font-bold text-black'
      )}
    >
      {children}
    </Link>
  );
};

function checkIsActive(href: string, pathname: string) {
  const cleanHref = href.split('?')[0];
  const cleanPathname = pathname.split('?')[0];

  if (cleanHref === cleanPathname) return true;

  if (
    cleanPathname.startsWith(cleanHref) &&
    cleanPathname.length > cleanHref.length
  ) {
    const nextChar = cleanPathname[cleanHref.length];
    return nextChar === '/';
  }

  return false;
}
