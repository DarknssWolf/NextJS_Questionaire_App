'use server';
import { db } from '@/server/db';
import { documentTable } from '@/server/db/schema/documentTable';
import { documentRequirementTable } from '@/server/db/schema/documentRequirementTable';
import { documentCategoryTable } from '@/server/db/schema/documentCategoryTable';
import { supplierDocumentStatusTable } from '@/server/db/schema/supplierDocumentStatusTable';
import { and, eq } from 'drizzle-orm';

export interface ActiveDocument {
  id: string;
  name: string;
  completed: boolean;
  lastUpdated?: string;
  fileUploadId?: number;
}

export type DocumentCategory = {
  id: string;
  name: string;
  documents: ActiveDocument[];
};

export async function getRequiredDocumentsForSupplier(
  supplierId: number
): Promise<{ categories: DocumentCategory[] }> {
  try {
    const documentsWithStatus = await db
      .select({
        categoryId: documentCategoryTable.id,
        categoryKey: documentCategoryTable.key,
        categoryName: documentCategoryTable.name,
        categorySortOrder: documentCategoryTable.sortOrder,
        documentId: documentTable.id,
        documentName: documentTable.name,
        documentRequirementId: documentRequirementTable.id,
        isRequired: documentRequirementTable.isRequired,
        status: supplierDocumentStatusTable.status,
        uploadedAt: supplierDocumentStatusTable.uploadedAt,
        fileUploadId: supplierDocumentStatusTable.fileUploadId,
      })
      .from(documentCategoryTable)
      .innerJoin(
        documentRequirementTable,
        eq(documentCategoryTable.id, documentRequirementTable.categoryId)
      )
      .innerJoin(
        documentTable,
        eq(documentRequirementTable.documentId, documentTable.id)
      )
      .leftJoin(
        supplierDocumentStatusTable,
        and(
          eq(
            documentRequirementTable.id,
            supplierDocumentStatusTable.documentRequirementId
          ),
          eq(supplierDocumentStatusTable.supplierId, supplierId)
        )
      )
      .where(
        and(
          eq(documentCategoryTable.isActive, true),
          eq(documentRequirementTable.isActive, true)
        )
      )
      .orderBy(documentCategoryTable.sortOrder);

    const categoryMap = new Map<string, DocumentCategory>();

    for (const row of documentsWithStatus) {
      if (!categoryMap.has(row.categoryKey)) {
        categoryMap.set(row.categoryKey, {
          id: row.categoryKey,
          name: row.categoryName,
          documents: [],
        });
      }

      const category = categoryMap.get(row.categoryKey)!;
      category.documents.push({
        id: row.documentRequirementId.toString(),
        name: row.documentName,
        completed: row.status === 'uploaded' || row.status === 'approved',
        lastUpdated: row.uploadedAt
          ? row.uploadedAt.toISOString().split('T')[0]
          : undefined,
        fileUploadId: row.fileUploadId ?? undefined,
      });
    }

    const documentCategories = Array.from(categoryMap.values());

    return {
      categories: documentCategories,
    };
  } catch (error) {
    console.error('Error getting required documents for supplier:', error);
    return {
      categories: [],
    };
  }
}
