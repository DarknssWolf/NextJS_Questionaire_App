import React from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { SessionProvider } from '@/providers/session-provider';
import { getSession } from '@/lib/auth/session';
import { BRAND } from '@/lib/brand';
import './globals.css';

import { Inter } from 'next/font/google';
import { type Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className={inter.className}>
      <body>
        <SessionProvider session={session}>
          <NuqsAdapter>
            <main>{children}</main>
          </NuqsAdapter>
        </SessionProvider>
      </body>
    </html>
  );
}
