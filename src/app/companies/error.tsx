'use client';

import ErrorBoundary from '@/components/errors/error-boundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      title="Unexpected error"
      description="Something unexpected happened. Please try again in a little while."
    />
  );
}
