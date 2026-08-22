import { QuestionnaireDataProvider } from '@/providers/questionnaire/QuestionnaireDataProvider';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

export default async function QuestionnaireLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <QuestionnaireDataProvider>{children}</QuestionnaireDataProvider>
        <Toaster position="top-center" richColors />
      </Suspense>
    </>
  );
}

function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <Loader2 className="text-primary size-16 animate-spin" />
      Loading questionnaire ...
    </div>
  );
}
