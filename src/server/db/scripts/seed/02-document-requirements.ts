import { db } from '@/server/db';
import { documentTable } from '../../schema/documentTable';
import { documentCategoryTable } from '../../schema/documentCategoryTable';
import { documentRequirementTable } from '../../schema/documentRequirementTable';

const supportingDocuments = [
  'Willow Creek Compliance Summary',
  'Blue Heron Operations Overview',
  'Granite Peak Assurance Letter',
];

export async function seedDocumentRequirements() {
  try {
    await db.transaction(async (tx) => {
      console.log('  document categories');

      const [category] = await tx
        .insert(documentCategoryTable)
        .values({
          key: 'supporting',
          name: 'Supporting Documentation',
          description: 'Supporting documentation',
          sortOrder: 1,
          isActive: true,
        })
        .returning();

      console.log('  documents');

      const insertedDocuments = await tx
        .insert(documentTable)
        .values(supportingDocuments.map((name) => ({ name })))
        .returning({ id: documentTable.id });

      console.log('  document requirements');

      await tx.insert(documentRequirementTable).values(
        insertedDocuments.map((doc) => ({
          categoryId: category.id,
          documentId: doc.id,
        }))
      );
    });
  } catch (error) {
    console.error('Error seeding document requirements:', error);
    throw error;
  }
}
