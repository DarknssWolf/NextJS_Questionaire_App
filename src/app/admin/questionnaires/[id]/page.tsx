import { QuestionnaireEditor } from '@/components/questionnaire/questionnaire-editor';
import { Button } from '@/components/ui/button';
import { getQuestionnaireStructure } from '@/server/services/questionnaire-admin.service';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const questionnaireId = Number(id);

  if (!Number.isInteger(questionnaireId)) notFound();

  const questionnaire = await getQuestionnaireStructure(questionnaireId);
  if (!questionnaire) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 py-8">
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href="/admin/questionnaires">
          <ArrowLeft />
          All questionnaires
        </Link>
      </Button>

      <QuestionnaireEditor questionnaire={questionnaire} />
    </div>
  );
}
