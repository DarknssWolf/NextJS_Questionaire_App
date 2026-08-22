'use server';

import { db } from '@/server/db';
import { documentRequirementTable } from '@/server/db/schema/documentRequirementTable';
import { supplierDocumentStatusTable } from '@/server/db/schema/supplierDocumentStatusTable';
import { and, eq } from 'drizzle-orm';

export async function initializeSupplierDocumentStatus(
  supplierId: number
): Promise<void> {
  try {
    const requirements = await db
      .select({ id: documentRequirementTable.id })
      .from(documentRequirementTable);

    if (requirements.length === 0) {
      console.warn('No document requirements found - run seed script first');
      return;
    }

    const statusRecords = requirements.map((requirement) => ({
      supplierId: supplierId,
      documentRequirementId: requirement.id,
      status: 'pending' as const,
    }));

    await db
      .insert(supplierDocumentStatusTable)
      .values(statusRecords)
      .onConflictDoNothing()
      .returning();
  } catch (error) {
    console.error(
      `Error initializing document status for supplier ${supplierId}:`,
      error
    );
    throw error;
  }
}

export async function updateSupplierDocumentStatus(
  supplierId: number,
  documentRequirementId: number,
  status: 'pending' | 'uploaded' | 'approved' | 'rejected',
  fileUploadId?: number,
  rejectionReason?: string,
  submissionId?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: Partial<typeof supplierDocumentStatusTable.$inferInsert> =
      {
        status,
        uploadedAt: status === 'uploaded' ? new Date() : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectedAt: status === 'rejected' ? new Date() : null,
        submissionId: submissionId,
        fileUploadId: fileUploadId ?? null,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
      };

    await db
      .update(supplierDocumentStatusTable)
      .set(updateData)
      .where(
        and(
          eq(supplierDocumentStatusTable.supplierId, supplierId),
          eq(
            supplierDocumentStatusTable.documentRequirementId,
            documentRequirementId
          )
        )
      );

    return {
      success: true,
      message: `Document status updated to ${status} for supplier ${supplierId}`,
    };
  } catch (error) {
    console.error('Error updating supplier document status:', error);
    return {
      success: false,
      message: 'Failed to update document status',
    };
  }
}

export async function getSupplierDocumentStats(supplierId: number): Promise<{
  total: number;
  pending: number;
  uploaded: number;
  approved: number;
  rejected: number;
  completionRate: number;
}> {
  try {
    const stats = await db
      .select({
        status: supplierDocumentStatusTable.status,
      })
      .from(supplierDocumentStatusTable)
      .where(eq(supplierDocumentStatusTable.supplierId, supplierId));

    const totals = {
      total: stats.length,
      pending: stats.filter((s) => s.status === 'pending').length,
      uploaded: stats.filter((s) => s.status === 'uploaded').length,
      approved: stats.filter((s) => s.status === 'approved').length,
      rejected: stats.filter((s) => s.status === 'rejected').length,
    };

    const completionRate =
      totals.total > 0
        ? Math.round(((totals.uploaded + totals.approved) / totals.total) * 100)
        : 0;

    return {
      ...totals,
      completionRate,
    };
  } catch (error) {
    console.error('Error getting supplier document stats:', error);
    return {
      total: 0,
      pending: 0,
      uploaded: 0,
      approved: 0,
      rejected: 0,
      completionRate: 0,
    };
  }
}
