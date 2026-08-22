'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import './globals.css';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="bg-background text-foreground min-h-screen">
          <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-10">
            <div className="mb-8 flex items-center gap-3">
              <Link href="/">
                <Image
                  src="/logo.svg"
                  alt={`${BRAND.name} logo`}
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
              <span className="sr-only">{BRAND.name}</span>
            </div>

            <Card className="border-base-700/20 bg-card/60 w-full max-w-xl backdrop-blur">
              <CardHeader className="items-center text-center">
                <div className="bg-brand-500/10 mb-2 inline-flex items-center justify-center rounded-full p-4">
                  <TriangleAlert className="text-brand-500 h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-semibold">
                  Something went wrong
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  We hit an unexpected error. Please try again in a little
                  while.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    variant="brand"
                    onClick={() => reset()}
                    aria-label="Try again"
                  >
                    Try again
                  </Button>
                </div>

                {(error?.message || error?.digest) && (
                  <div className="bg-muted/30 text-muted-foreground mt-6 rounded-lg border p-4 text-sm">
                    <details>
                      <summary className="text-foreground cursor-pointer font-medium select-none">
                        Technical details
                      </summary>
                      <div className="mt-2 break-words">
                        {error?.message && (
                          <p className="whitespace-pre-wrap">{error.message}</p>
                        )}
                        {error?.digest && (
                          <p className="mt-2 text-xs">Digest: {error.digest}</p>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-muted-foreground mt-8 text-center text-xs">
              If this keeps happening, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
