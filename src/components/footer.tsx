'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';

const FOOTER_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/contact', label: 'Contact' },
] as const;

export default function Footer() {
  const copyright = `Copyright ${BRAND.name} ${new Date().getFullYear()}`;

  return (
    <footer className="bg-base-900 w-full">
      <div className="container mx-auto flex flex-col items-start justify-between gap-8 px-4 py-10 md:flex-row md:items-center md:px-8">
        <div className="flex flex-col items-start gap-3">
          <div className="flex">
            <Image
              src="/logo-light.svg"
              alt={BRAND.name}
              width={240}
              height={82}
              priority
            />
          </div>
          <p className="text-base-300 text-sm">{copyright}</p>
        </div>

        <nav className="flex flex-wrap gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base-200 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
