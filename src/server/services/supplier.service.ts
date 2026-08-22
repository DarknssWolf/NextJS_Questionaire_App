'use server';
import { EvaluationRiskLevel } from '@/enums/evaluation';
import { createUser, getUserByEmail } from '@/lib/auth/users';
import { usersTable } from '@/server/db/schema/userTable';
import { supplierAdditionalContactsTable } from '@/server/db/schema/supplierAdditionalContactsTable';
import {
  type AggregatedScoreDetails,
  type CompanySupplierSummary,
  type CreateSupplierDetails,
  type SupplierDetails,
  type SupplierLatestSubmission,
} from '@/models/Supplier';
import { db } from '@/server/db';
import { companySizesTable } from '@/server/db/schema/companySizesTable';
import { countryTable } from '@/server/db/schema/countryTable';
import { emailLogTable } from '@/server/db/schema/emailLogTable';
import { industryTable } from '@/server/db/schema/industryTable';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { submissionsTable } from '@/server/db/schema/submissionsTable';
import { supplierDocumentStatusTable } from '@/server/db/schema/supplierDocumentStatusTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import { calculateSupplierEvaluationStatus } from '@/server/services/dashboard.service';
import {
  type SupplierSubmissionSummary,
  getSupplierSubmissionSummary,
} from '@/server/services/submission.service';
import { initializeSupplierDocumentStatus } from '@/server/services/supplier-document.service';
import { EmailType } from '@/types/emailType';
import { isSubmitted } from '@/types/questionnaire-data';
import { parse } from 'csv-parse/sync';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { companySupplierTable } from '../db/schema/companySupplierTable';
import {
  SupplierRowSchema,
  type SupplierProcessResult,
  type SupplierRow,
} from '@/types/supplier-data';

const BATCH_SIZE = 1000;

function toEvaluationRiskLevel(
  summary: SupplierSubmissionSummary
): EvaluationRiskLevel {
  if (!summary.isSubmitted) return EvaluationRiskLevel.NOT_ASSESSED;
  if (summary.riskLevel === 'low') return EvaluationRiskLevel.LOW;
  if (summary.riskLevel === 'medium') return EvaluationRiskLevel.MEDIUM;
  return EvaluationRiskLevel.HIGH;
}

export async function parseSupplierCsv(
  formData: FormData
): Promise<SupplierProcessResult> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return {
        baseFileName: '',
        parsedData: [],
        errors: [{ row: 0, field: 'file', message: 'No file provided' }],
      };
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.csv')) {
      return {
        baseFileName: '',
        parsedData: [],
        errors: [
          { row: 0, field: 'file', message: 'Please upload a CSV file (.csv)' },
        ],
      };
    }

    const baseFileName = file.name.replace('.csv', '');
    const csvData = await file.text();

    const rawParsed = parse(csvData, {
      columns: true,
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as SupplierRow[];

    if (!rawParsed.length) {
      return {
        baseFileName,
        parsedData: [],
        errors: [
          {
            row: 1,
            field: 'file',
            message: 'Supplier CSV file is empty or invalid.',
          },
        ],
      };
    }

    const expectedColumns = [
      'Company Name',
      'Registration Number',
      'Primary Contact Name',
      'Primary Contact Email',
      'Additional Notes',
    ];

    const headers = Object.keys(rawParsed[0]);
    const missing = expectedColumns.filter((col) => !headers.includes(col));

    if (missing.length > 0) {
      return {
        baseFileName,
        parsedData: [],
        errors: [
          {
            row: 1,
            field: 'headers',
            message: `Missing required columns: ${missing.join(', ')}. Expected: ${expectedColumns.join(', ')}`,
          },
        ],
      };
    }

    const filteredData = rawParsed.map((row) => {
      const source: Record<string, string | undefined> = row;
      const filteredRow: Record<string, string> = {};
      expectedColumns.forEach((column) => {
        filteredRow[column] = source[column] ?? '';
      });
      return filteredRow as SupplierRow;
    });

    const validation = z.array(SupplierRowSchema).safeParse(filteredData);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        row: (issue.path[0] as number) + 2, // +2 to account for header row and 1-based indexing
        field: issue.path[1] as string,
        message: issue.message,
      }));

      return {
        baseFileName,
        parsedData: filteredData,
        errors,
      };
    }

    const duplicateNames: string[] = [];
    const seenNames = new Set<string>();

    validation.data.forEach((row) => {
      const companyName = row['Company Name'];
      if (seenNames.has(companyName)) {
        duplicateNames.push(companyName);
      } else {
        seenNames.add(companyName);
      }
    });

    if (duplicateNames.length > 0) {
      return {
        baseFileName,
        parsedData: filteredData,
        errors: [
          {
            row: 1,
            field: 'Company Name',
            message: `Duplicate company names found: ${[...new Set(duplicateNames)].join(', ')}`,
          },
        ],
      };
    }

    return {
      baseFileName,
      parsedData: validation.data,
      errors: [],
    };
  } catch (error) {
    console.error('Error parsing supplier CSV:', error);
    return {
      baseFileName: '',
      parsedData: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'Failed to parse CSV file. Please check the file format.',
        },
      ],
    };
  }
}

export async function insertSupplierData(
  parsedData: SupplierRow[],
  companyId: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (!parsedData.length) {
      return { success: false, message: 'No supplier data provided.' };
    }

    let totalInserted = 0;
    let totalLinked = 0;

    for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
      const batch = parsedData.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        const newSupplier: CreateSupplierDetails = {
          companyId: companyId,
          name: row['Company Name'],
          registrationNumber: row['Registration Number'],
          primaryContactName: row['Primary Contact Name'] ?? '',
          primaryContactEmail: row['Primary Contact Email'].toLowerCase(),
          additionalNotes: row['Additional Notes'] ?? '',
          status: 'active',
        };

        const result = await createSupplier(newSupplier, true);

        if (result?.success === true) {
          totalInserted += 1;
        }
      }
    }

    const existingSuppliers = await db
      .select({
        id: supplierTable.id,
        email: supplierTable.primaryContactEmail,
      })
      .from(supplierTable)
      .where(
        inArray(
          sql`LOWER(${supplierTable.primaryContactEmail})`,
          parsedData.map((row) => row['Primary Contact Email'].toLowerCase())
        )
      );

    for (const supplier of existingSuppliers) {
      const existingCompanySupplier = await db
        .select()
        .from(companySupplierTable)
        .where(
          and(
            eq(companySupplierTable.companyId, companyId),
            eq(companySupplierTable.supplierId, supplier.id)
          )
        )
        .limit(1);

      if (existingCompanySupplier.length === 0) {
        await db.insert(companySupplierTable).values({
          companyId: companyId,
          supplierId: supplier.id,
        });
        totalLinked += 1;
      }
    }

    const skippedCount = parsedData.length - totalInserted;
    const linkedMessage =
      totalLinked > 0 ? `, ${totalLinked} existing suppliers linked` : '';
    const skippedMessage =
      skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : '';

    return {
      success: true,
      message: `Successfully imported ${totalInserted} suppliers${linkedMessage}${skippedMessage}.`,
    };
  } catch (error) {
    console.error('Error inserting supplier data:', error);
    return {
      success: false,
      message: 'Failed to insert supplier data. Please try again.',
    };
  }
}

export async function checkExistingSuppliers(parsedData: SupplierRow[]) {
  const existingSuppliers = await db
    .select({
      id: supplierTable.id,
      email: supplierTable.primaryContactEmail,
    })
    .from(supplierTable)
    .where(
      inArray(
        sql`LOWER(${supplierTable.primaryContactEmail})`,
        parsedData.map((row) => row['Primary Contact Email'].toLowerCase())
      )
    );

  return existingSuppliers;
}

export async function deleteSupplier(
  supplierId: number
): Promise<{ success: boolean; message: string }> {
  const supplier = await db
    .select()
    .from(supplierTable)
    .where(eq(supplierTable.id, supplierId));

  if (!supplier) {
    return {
      success: false,
      message: 'Supplier not found',
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(supplierDocumentStatusTable)
        .where(eq(supplierDocumentStatusTable.supplierId, supplierId));

      await tx
        .delete(submissionsTable)
        .where(eq(submissionsTable.supplierId, supplierId));

      await tx
        .delete(companySupplierTable)
        .where(eq(companySupplierTable.supplierId, supplierId));

      await tx
        .delete(supplierAdditionalContactsTable)
        .where(eq(supplierAdditionalContactsTable.supplierId, supplierId));

      await tx.delete(usersTable).where(eq(usersTable.supplierId, supplierId));

      await tx.delete(supplierTable).where(eq(supplierTable.id, supplierId));
    });

    return {
      success: true,
      message: 'Suppliers deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: 'Failed to delete user',
    };
  }
}

export async function getSuppliers(companyId: number): Promise<{
  success: boolean;
  data: CompanySupplierSummary[];
  message?: string;
}> {
  try {
    const results = await db
      .select({
        id: supplierTable.id,
        name: supplierTable.name,
        industry: industryTable.name,
        country: countryTable.name,
        companySize: companySizesTable.name,
        spendCategory: spendCategoryTable.category1,
        status: supplierTable.status,
        verified: supplierTable.verified,
        lastEvaluationDate: supplierTable.updatedAt,
        primaryContactName: supplierTable.primaryContactName,
        primaryContactEmail: supplierTable.primaryContactEmail,
        dateInviteSent: emailLogTable.createdAt,
      })
      .from(supplierTable)
      .leftJoin(industryTable, eq(supplierTable.industryId, industryTable.id))
      .leftJoin(countryTable, eq(supplierTable.countryId, countryTable.id))
      .leftJoin(
        companySizesTable,
        eq(supplierTable.companySizeId, companySizesTable.id)
      )
      .leftJoin(
        spendCategoryTable,
        eq(supplierTable.spendCategoryId, spendCategoryTable.id)
      )
      .innerJoin(
        companySupplierTable,
        eq(supplierTable.id, companySupplierTable.supplierId)
      )
      .leftJoin(
        emailLogTable,
        and(
          eq(supplierTable.id, emailLogTable.supplierId),
          eq(emailLogTable.companyId, companyId),
          eq(emailLogTable.emailType, EmailType.EVALUATION_INVITATION)
        )
      )
      .where(eq(companySupplierTable.companyId, companyId))
      .orderBy(asc(supplierTable.name));

    if (!results || results.length === 0) {
      return { success: true, data: [], message: undefined };
    }

    const mappedSuppliers: CompanySupplierSummary[] = await Promise.all(
      results.map(async (result) => {
        const [summary, completionStatus] = await Promise.all([
          getSupplierSubmissionSummary(result.id),
          calculateSupplierEvaluationStatus(result.id),
        ]);

        return {
          id: result.id,
          name: result.name,
          industry: result.industry ?? '',
          riskLevel: toEvaluationRiskLevel(summary),
          lastEvaluation: formatDateDDMMYYYY(result.lastEvaluationDate),
          dueDate: formatDateDDMMYYYY(summary.dueDate),
          currentEvaluationScore: summary.scorePercent,
          evaluationProgress: summary.progressPercent,
          country: result.country ?? '',
          status: result.status,
          verified: result.verified ?? false,
          evaluationScore: summary.scorePercent,
          spendCategory: result.spendCategory ?? '',
          completionStatus: completionStatus,
          wasAutoSubmitted: summary.wasAutoSubmitted,
          wasManuallySubmitted: summary.wasManuallySubmitted,
          primaryContactName: result.primaryContactName ?? '',
          primaryContactEmail: result.primaryContactEmail ?? '',
          dateInviteSent: formatDateDDMMYYYY(result.dateInviteSent),
        };
      })
    );

    return { success: true, data: mappedSuppliers, message: undefined };
  } catch {
    return {
      success: false,
      data: [],
      message: 'Failed to fetch suppliers from the database.',
    };
  }
}

function formatDateDDMMYYYY(
  dateInput: string | number | Date | null | undefined
): string {
  let registrationDate = '';
  if (dateInput) {
    const date = new Date(dateInput);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    registrationDate = `${day}/${month}/${year}`;
  }
  return registrationDate;
}

export async function getSupplierById(
  supplierId: number
): Promise<SupplierDetails | null> {
  if (!supplierId || supplierId <= 0) {
    throw new Error('Invalid supplier ID provided');
  }

  const supplier = await db
    .select({
      name: supplierTable.name,
      industry: industryTable.name,
      address: supplierTable.address,
      annualSpend: supplierTable.annualSpend,
      fteHeadcount: supplierTable.fteHeadcount,
      primaryContactEmail: supplierTable.primaryContactEmail,
      primaryContactPhone: supplierTable.primaryContactPhone,
      spendCategory: spendCategoryTable.category1,
      registrationDate: supplierTable.createdAt,
      lastEvaluationDate: supplierTable.updatedAt,
      mainProductType: supplierTable.mainProductType,
      peakSeason: supplierTable.peakSeason,
      lowSeason: supplierTable.lowSeason,
    })
    .from(supplierTable)
    .leftJoin(industryTable, eq(supplierTable.industryId, industryTable.id))
    .leftJoin(
      spendCategoryTable,
      eq(supplierTable.spendCategoryId, spendCategoryTable.id)
    )
    .where(eq(supplierTable.id, supplierId))
    .limit(1);

  if (!supplier.length) {
    return null;
  }

  const [supplierDetails] = supplier;
  if (!supplierDetails) {
    return null;
  }

  const [evaluationStatus, summary] = await Promise.all([
    calculateSupplierEvaluationStatus(supplierId),
    getSupplierSubmissionSummary(supplierId),
  ]);

  const aggregatedScoreDetails: AggregatedScoreDetails = {
    score: summary.scorePercent,
    changePercentage: 0,
    riskLevel: toEvaluationRiskLevel(summary),
    findings: summary.isSubmitted
      ? {
          distribution: {
            high: summary.riskLevel === 'high' ? 1 : 0,
            medium: summary.riskLevel === 'medium' ? 1 : 0,
            low: summary.riskLevel === 'low' ? 1 : 0,
          },
        }
      : undefined,
    evaluationStatus: evaluationStatus,
  };

  return {
    ...supplierDetails,
    registrationDate: formatDateDDMMYYYY(supplierDetails.registrationDate),
    lastEvaluationDate: formatDateDDMMYYYY(supplierDetails.lastEvaluationDate),
    evaluationStatus: evaluationStatus,
    mainProductType: supplierDetails.mainProductType ?? '',
    peakSeason: supplierDetails.peakSeason ?? '',
    lowSeason: supplierDetails.lowSeason ?? '',
    industry: supplierDetails.industry ?? '',
    spendCategory: supplierDetails.spendCategory ?? '',
    fteHeadcount: supplierDetails.fteHeadcount ?? 0,
    annualSpend: supplierDetails.annualSpend ?? 0,
    verified: false,
    aggregatedScoreDetails: aggregatedScoreDetails,
  };
}

export async function getSupplierLatestSubmission(
  supplierId: number
): Promise<SupplierLatestSubmission> {
  const [submission] = await db
    .select({
      id: submissionsTable.id,
      status: submissionsTable.status,
      submittedAt: submissionsTable.submittedAt,
      dueDate: submissionsTable.dueDate,
    })
    .from(submissionsTable)
    .where(eq(submissionsTable.supplierId, supplierId))
    .orderBy(desc(submissionsTable.submittedAt), desc(submissionsTable.id))
    .limit(1);

  return {
    isSubmitted: submission ? isSubmitted(submission.status) : false,
    id: submission?.id,
    dueDate: submission?.dueDate ?? null,
  };
}

export async function checkSupplierEmailExists(email: string): Promise<{
  exists: boolean;
  supplier?: { id: number; name: string; primaryContactEmail: string };
}> {
  try {
    if (!email || email.trim() === '') {
      return { exists: false };
    }

    const existingSupplier = await db
      .select({
        id: supplierTable.id,
        name: supplierTable.name,
        primaryContactEmail: supplierTable.primaryContactEmail,
      })
      .from(supplierTable)
      .where(
        eq(
          sql`LOWER(${supplierTable.primaryContactEmail})`,
          email.toLowerCase()
        )
      )
      .limit(1);

    if (existingSupplier.length > 0) {
      return { exists: true, supplier: existingSupplier[0] };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking supplier email:', error);
    return { exists: false };
  }
}

export async function createSupplier(
  supplierDetails: CreateSupplierDetails,
  isBulkUpload = false
): Promise<{ success: boolean; message?: string; supplierId?: number }> {
  try {
    if (!supplierDetails) {
      return {
        success: false,
        message: 'Invalid supplier details provided',
      };
    }

    if (!isBulkUpload) {
      if (
        supplierDetails.companyId === undefined ||
        supplierDetails.industryId === undefined ||
        supplierDetails.countryId === undefined ||
        supplierDetails.companySizeId === undefined ||
        supplierDetails.spendCategoryId === undefined
      ) {
        return {
          success: false,
          message: 'Missing required supplier fields',
        };
      }
    }

    const newSupplier = await db.transaction(async (tx) => {
      const existingSupplier = await tx
        .select()
        .from(supplierTable)
        .where(
          eq(
            sql`LOWER(${supplierTable.primaryContactEmail})`,
            supplierDetails.primaryContactEmail.toLowerCase()
          )
        )
        .limit(1);

      let isNewSupplier = false;
      let newSupplier: (typeof supplierTable.$inferSelect)[] | null = null;
      if (existingSupplier.length === 0) {
        newSupplier = await tx
          .insert(supplierTable)
          .values({
            name: supplierDetails.name || '',
            registrationNumber: supplierDetails.registrationNumber || '',
            industryId: supplierDetails.industryId,
            countryId: supplierDetails.countryId,
            address: supplierDetails.address ?? '',
            website: supplierDetails.website,
            companySizeId: supplierDetails.companySizeId,
            annualSpend: supplierDetails.annualSpend,
            fteHeadcount: supplierDetails.fteHeadcount,
            primaryContactName: supplierDetails.primaryContactName || '',
            primaryContactPosition:
              supplierDetails.primaryContactPosition ?? '',
            primaryContactEmail: supplierDetails.primaryContactEmail || '',
            primaryContactPhone: supplierDetails.primaryContactPhone ?? '',
            additionalNotes: supplierDetails.additionalNotes,
            spendCategoryId: supplierDetails.spendCategoryId,
            peakSeason: supplierDetails.peakSeason,
            status: supplierDetails.status || 'active',
          })
          .returning();

        if (!newSupplier) {
          return null;
        }

        isNewSupplier = true;
      } else {
        newSupplier = existingSupplier;
        isNewSupplier = false;
      }

      if (isNewSupplier) {
        const existingUser = await getUserByEmail(
          newSupplier[0].primaryContactEmail,
          tx
        );

        if (!existingUser) {
          try {
            const user = await createUser(
              newSupplier[0].primaryContactEmail,
              'supplier_admin',
              { supplierId: newSupplier[0].id },
              tx
            );

            if (!user) {
              throw new Error('Email is already registered');
            }
          } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('User with these details already exists');
          }
        }
      }

      return newSupplier;
    });

    if (!newSupplier) {
      return { success: false, message: 'Failed to create supplier' };
    }

    const existingCompanySupplier = await db
      .select()
      .from(companySupplierTable)
      .where(
        and(
          eq(companySupplierTable.companyId, supplierDetails.companyId),
          eq(companySupplierTable.supplierId, newSupplier[0].id)
        )
      )
      .limit(1);

    if (existingCompanySupplier.length === 0) {
      await db.insert(companySupplierTable).values({
        companyId: supplierDetails.companyId,
        supplierId: newSupplier[0].id,
      });
    }

    try {
      await initializeSupplierDocumentStatus(newSupplier[0].id);
    } catch (documentError) {
      console.error(
        'Warning: Failed to initialize document status for new supplier:',
        documentError
      );
    }

    return {
      success: true,
      message: 'Supplier created successfully',
      supplierId: newSupplier[0].id,
    };
  } catch {
    return { success: false, message: 'Failed to create supplier' };
  }
}
export async function verifySupplier(supplierId: number): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await db
      .update(supplierTable)
      .set({
        verified: true,
      })
      .where(eq(supplierTable.id, supplierId));

    return {
      success: true,
      message: 'Supplier verified successfully',
    };
  } catch (error) {
    console.error('Error verifying supplier:', error);
    return {
      success: false,
      message: 'Failed to verify supplier',
    };
  }
}

export async function removeSupplierFromCompany(
  supplierId: number,
  companyId: number
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const existingLink = await db
      .select()
      .from(companySupplierTable)
      .where(
        and(
          eq(companySupplierTable.companyId, companyId),
          eq(companySupplierTable.supplierId, supplierId)
        )
      )
      .limit(1);

    if (existingLink.length === 0) {
      return {
        success: false,
        message: 'Supplier is not linked to this company',
      };
    }

    await db
      .delete(companySupplierTable)
      .where(
        and(
          eq(companySupplierTable.companyId, companyId),
          eq(companySupplierTable.supplierId, supplierId)
        )
      );

    return {
      success: true,
      message: 'Supplier removed from company successfully',
    };
  } catch (error) {
    console.error('Error removing supplier from company:', error);
    return {
      success: false,
      message: 'Failed to remove supplier from company',
    };
  }
}
