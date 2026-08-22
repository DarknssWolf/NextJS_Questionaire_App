import { QuestionnaireUpload } from '@/components/questionnaire/questionnaire-upload';
import { listQuestionnaires } from '@/server/services/questionnaire-admin.service';

export const dynamic = 'force-dynamic';

export default async function UploadQuestionnairePage() {
  const existing = await listQuestionnaires();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Upload a questionnaire</h1>
        <p className="text-muted-foreground">
          Uploading is the only way to create or restructure a questionnaire.
          Small text corrections can be made afterwards without a new upload.
        </p>
      </div>

      <QuestionnaireUpload existing={existing} />
    </div>
  );
}
