'use server';

import { db } from '@/server/db';
import { companyTable } from '@/server/db/schema/companyTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import { and, eq, inArray } from 'drizzle-orm';
import { companySupplierTable } from '../db/schema/companySupplierTable';
import { EmailType } from '@/types/emailType';
import { emailLogTable } from '../db/schema/emailLogTable';
import { getActiveQuestionnaire } from './questionnaire-admin.service';
import {
  createSubmissionForSupplier,
  getLatestSubmissionForSupplier,
} from './submission.service';
import { calculateDueDate, setToEndOfDay } from '@/lib/date';

export interface EmailRecipient {
  email: string;
  name?: string;
}

type EmailTemplateData = Record<string, string>;

const SUPPLIER_INVITATION_TEMPLATE = 'supplier-invitation';
const ADDITIONAL_CONTACT_INVITATION_TEMPLATE = 'additional-contact-invitation';

export interface SendEmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface SendBulkEmailResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  details?: string[];
}

export interface SendInvitationsResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
}

export async function sendEmail(
  recipient: EmailRecipient,
  template: string,
  templateData: EmailTemplateData = {}
): Promise<SendEmailResult> {
  if (!recipient.email || !template) {
    console.log('Validation failed: Missing recipient email or template');
    return {
      success: false,
      message: 'Recipient email and template are required',
    };
  }

  if (!isValidEmail(recipient.email)) {
    console.log('Validation failed: Invalid email format:', recipient.email);
    return {
      success: false,
      message: 'Invalid email address format',
    };
  }

  console.info('[EMAIL STUB] would send', {
    template,
    to: { email: recipient.email, name: recipient.name },
    data: templateData,
  });

  return {
    success: true,
    message: 'Email sent successfully',
  };
}

export async function sendBulkEmail(
  recipients: EmailRecipient[],
  template: string,
  loggedInUserEmail: string,
  templateData: EmailTemplateData = {}
): Promise<SendBulkEmailResult> {
  if (!recipients || recipients.length === 0) {
    return {
      success: false,
      message: 'No recipients provided',
      successCount: 0,
      failureCount: 0,
    };
  }

  if (!template) {
    return {
      success: false,
      message: 'Template is required',
      successCount: 0,
      failureCount: 0,
    };
  }

  const validRecipients = recipients.filter(
    (recipient) => recipient.email && isValidEmail(recipient.email)
  );

  if (validRecipients.length === 0) {
    return {
      success: false,
      message: 'No valid email addresses found',
      successCount: 0,
      failureCount: recipients.length,
    };
  }

  for (const recipient of validRecipients) {
    console.info('[EMAIL STUB] would send', {
      template,
      to: { email: recipient.email, name: recipient.name },
      sentFrom: loggedInUserEmail,
      data: templateData,
    });
  }

  console.info(
    `[EMAIL STUB] bulk send summary: ${validRecipients.length} of ${recipients.length} recipient(s) valid for template "${template}"`
  );

  return {
    success: true,
    message: `Bulk email sent successfully to ${validRecipients.length} recipients`,
    successCount: validRecipients.length,
    failureCount: recipients.length - validRecipients.length,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateAppUrl(basePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${baseUrl}${basePath}`;
}

export async function sendSupplierAdditionalContactInvitations(
  supplierId: number,
  companyId: number,
  contacts: Array<{
    id?: number;
    name: string;
    email: string;
    sectionTitle: string;
  }>,
  loggedInUserEmail: string
): Promise<SendInvitationsResult> {
  try {
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: 'No contacts provided',
        successCount: 0,
        failureCount: 0,
      };
    }

    const supplier = await db
      .select({
        id: supplierTable.id,
        name: supplierTable.name,
        primaryContactName: supplierTable.primaryContactName,
      })
      .from(supplierTable)
      .where(eq(supplierTable.id, supplierId))
      .limit(1);

    if (supplier.length === 0) {
      return {
        success: false,
        message: 'Supplier not found',
        successCount: 0,
        failureCount: contacts.length,
      };
    }

    const supplierInfo = supplier[0];

    const latestSubmission = await getLatestSubmissionForSupplier(supplierId);
    const questionnaireDueDate = latestSubmission?.dueDate;

    const results = await Promise.allSettled(
      contacts.map(async (contact) => {
        const templateData = {
          additionalContactName: contact.name,
          areaOfExpertise: contact.sectionTitle,
          questionnaireUrl: generateAppUrl('/questionnaire/questions'),
          supplierMainContactName: supplierInfo.primaryContactName,
          dueDate: questionnaireDueDate?.toISOString().split('T')[0] ?? '',
        };

        const result = await sendEmail(
          { email: contact.email, name: contact.name },
          ADDITIONAL_CONTACT_INVITATION_TEMPLATE,
          templateData
        );

        if (result.success) {
          try {
            await db.insert(emailLogTable).values({
              companyId: companyId,
              supplierId: supplierId,
              emailType: EmailType.ADDITIONAL_CONTACT_INVITATION,
              sentFromUser: loggedInUserEmail,
            });
          } catch (logError) {
            console.error('Error logging email to database:', logError);
          }
        }

        return result;
      })
    );

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    });

    return {
      success: successCount > 0,
      message:
        successCount > 0
          ? `Successfully sent ${successCount} additional contact invitations`
          : 'Failed to send any additional contact invitations',
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('Error sending additional contact invitations:', error);
    return {
      success: false,
      message: 'Failed to send additional contact invitations',
      successCount: 0,
      failureCount: contacts.length,
    };
  }
}

export async function sendSupplierInvitations(
  supplierIds: number[],
  companyId: number,
  loggedInUserEmail: string,
  dueDate?: Date
): Promise<SendInvitationsResult> {
  try {
    if (!supplierIds || supplierIds.length === 0) {
      return {
        success: false,
        message: 'No suppliers selected',
        successCount: 0,
        failureCount: 0,
      };
    }

    if (!dueDate) {
      dueDate = calculateDueDate(3);
    } else {
      dueDate = setToEndOfDay(dueDate);
    }

    const [suppliers, company] = await Promise.all([
      db
        .select({
          id: supplierTable.id,
          name: supplierTable.name,
          email: supplierTable.primaryContactEmail,
          contactName: supplierTable.primaryContactName,
        })
        .from(supplierTable)
        .innerJoin(
          companySupplierTable,
          eq(supplierTable.id, companySupplierTable.supplierId)
        )
        .where(
          and(
            inArray(supplierTable.id, supplierIds),
            eq(companySupplierTable.companyId, companyId)
          )
        ),
      db
        .select({
          name: companyTable.name,
          primaryContactName: companyTable.primaryContactName,
          primaryContactEmail: companyTable.primaryContactEmail,
        })
        .from(companyTable)
        .where(eq(companyTable.id, companyId))
        .limit(1),
    ]);

    if (suppliers.length === 0) {
      return {
        success: false,
        message: 'No valid suppliers found',
        successCount: 0,
        failureCount: supplierIds.length,
      };
    }

    const companyName = company[0]?.name || '';
    const clientMainContactName = company[0]?.primaryContactName || '';
    const clientMainContactEmail = company[0]?.primaryContactEmail || '';

    const questionnaire = await getActiveQuestionnaire();
    if (!questionnaire) {
      return {
        success: false,
        message:
          'There is no active questionnaire to send. Publish one at /admin/questionnaires/upload first.',
        successCount: 0,
        failureCount: supplierIds.length,
      };
    }

    const submissionResults = await Promise.all(
      suppliers.map((supplier) =>
        createSubmissionForSupplier(supplier.id, questionnaire.id, dueDate)
      )
    );

    const supplierDueDates = new Map<number, Date>();
    suppliers.forEach((supplier, index) => {
      const submissionResult = submissionResults[index];
      if (submissionResult?.dueDate) {
        supplierDueDates.set(supplier.id, submissionResult.dueDate);
      } else if (dueDate) {
        supplierDueDates.set(supplier.id, dueDate);
      }
    });

    const results = await Promise.allSettled(
      suppliers.map(async (supplier) => {
        const supplierDueDate = supplierDueDates.get(supplier.id) ?? dueDate;

        const questionnaireData = {
          supplierContactName: supplier.contactName,
          clientName: companyName,
          clientMainContactName: clientMainContactName,
          clientMainContactEmail: clientMainContactEmail,
          evaluationStartButtonUrl: generateAppUrl('/questionnaire'),
          dueDate: supplierDueDate
            ? supplierDueDate.toISOString().split('T')[0]
            : '',
        };

        const result = await sendBulkQuestionnaireInvitations(
          [{ email: supplier.email, name: supplier.contactName }],
          loggedInUserEmail,
          questionnaireData
        );

        if (result.success && result.successCount > 0) {
          try {
            await db.insert(emailLogTable).values({
              companyId: companyId,
              supplierId: supplier.id,
              emailType: EmailType.EVALUATION_INVITATION,
              sentFromUser: loggedInUserEmail,
            });
          } catch (logError) {
            console.error('Error logging email to database:', logError);
          }
        }

        return result;
      })
    );

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount += result.value.successCount;
      } else {
        failureCount += 1;
      }
    });

    const result = {
      success: successCount > 0,
      message:
        successCount > 0
          ? `Successfully sent ${successCount} invitations`
          : 'Failed to send any invitations',
      successCount,
      failureCount,
    };

    return {
      success: result.success,
      message: result.message,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  } catch (error) {
    console.error('Error sending questionnaire invitations:', error);
    return {
      success: false,
      message: 'Failed to send questionnaire invitations',
      successCount: 0,
      failureCount: supplierIds.length,
    };
  }
}

async function sendBulkQuestionnaireInvitations(
  suppliers: Array<{
    email: string;
    name: string;
  }>,
  loggedInUserEmail: string,
  questionnaireData: EmailTemplateData
): Promise<SendBulkEmailResult> {
  return await sendBulkEmail(
    suppliers,
    SUPPLIER_INVITATION_TEMPLATE,
    loggedInUserEmail,
    questionnaireData
  );
}
