import { db } from '../..';
import { sectionsTable } from '../../schema/sectionsTable';
import { supplierAdditionalContactsTable } from '../../schema/supplierAdditionalContactsTable';
import {
  importQuestionnaire,
  parseQuestionnaireCsv,
} from '@/server/services/questionnaire-import.service';
import { asc, eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { type SeededOrg } from './03-users-and-companies';

export const SAMPLE_CSV_PATH = 'public/csv/sample-questionnaire.csv';

export interface SeededQuestionnaire {
  questionnaireId: number;
  version: number;
  sections: { id: number; title: string }[];
}

export async function seedQuestionnaire(
  org: SeededOrg
): Promise<SeededQuestionnaire> {
  console.log(`  importing ${SAMPLE_CSV_PATH}`);

  const formData = new FormData();
  formData.append(
    'file',
    new File(
      [readFileSync(SAMPLE_CSV_PATH, 'utf8')],
      'sample-questionnaire.csv'
    )
  );

  const parsed = await parseQuestionnaireCsv(formData);
  if (parsed.errors.length > 0) {
    throw new Error(
      [
        `${SAMPLE_CSV_PATH} did not parse cleanly — the sample must always pass its own import:`,
        ...parsed.errors.map((e) => `  row ${e.row} ${e.field}: ${e.message}`),
      ].join('\n')
    );
  }

  const result = await importQuestionnaire(parsed.rows, {
    kind: 'new',
    name: 'Supplier Evaluation Questionnaire',
    description:
      'Scored assessment questions for direct-spend suppliers, in three sections.',
  });

  if (!result.success || !result.questionnaireId) {
    throw new Error(
      [
        `${SAMPLE_CSV_PATH} was rejected by the importer:`,
        `  ${result.message}`,
        ...(result.errors ?? []).map(
          (e) => `  row ${e.row} ${e.field}: ${e.message}`
        ),
      ].join('\n')
    );
  }

  console.log(`  ${result.message}`);

  const sections = await db
    .select({ id: sectionsTable.id, title: sectionsTable.title })
    .from(sectionsTable)
    .where(eq(sectionsTable.questionnaireId, result.questionnaireId))
    .orderBy(asc(sectionsTable.sortOrder));

  if (org.additionalContactUserId && sections[0]) {
    console.log(`  additional contact → "${sections[0].title}" section`);
    await db.insert(supplierAdditionalContactsTable).values({
      userId: org.additionalContactUserId,
      supplierId: org.supplierIds[0],
      name: 'Jo Naidoo',
      role: 'Section Lead',
      email: 'contact@local.dev',
      sectionId: sections[0].id,
    });
  }

  return {
    questionnaireId: result.questionnaireId,
    version: result.version ?? 1,
    sections,
  };
}
