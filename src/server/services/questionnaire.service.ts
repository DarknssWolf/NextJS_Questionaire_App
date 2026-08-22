'use server';
import { createUser, deleteUserById, getUserByEmail } from '@/lib/auth/users';
import { type QuestionnaireSupplierFormData } from '@/lib/schemas/questionnaire-supplier-form';
import {
  type QuestionnaireSupplierDetails,
  type SupplierAdditionalContacts,
  type SupplierDetailsLookupData,
} from '@/models/Supplier';
import { db } from '@/server/db';
import { companySizesTable } from '@/server/db/schema/companySizesTable';
import { countryTable } from '@/server/db/schema/countryTable';
import { industryTable } from '@/server/db/schema/industryTable';
import { spendCategoryTable } from '@/server/db/schema/spendCategoryTable';
import { supplierAdditionalContactsTable } from '@/server/db/schema/supplierAdditionalContactsTable';
import { supplierTable } from '@/server/db/schema/supplierTable';
import {
  getCompanySizes,
  getCountries,
  getIndustries,
  getSpendCategories,
} from '@/server/services/lookup.service';
import { getOrCreateSubmission } from '@/server/services/submission.service';
import { eq } from 'drizzle-orm';

export async function getSupplierById(supplierId: number): Promise<{
  success: boolean;
  data?: QuestionnaireSupplierDetails;
  message?: string;
}> {
  try {
    if (!supplierId || supplierId <= 0) {
      return { success: false, message: 'Invalid supplier ID provided' };
    }

    const submission = await getOrCreateSubmission(supplierId);
    if (!submission.success || !submission.data) {
      return { success: false, message: submission.message };
    }

    const result = await db
      .select()
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
      .where(eq(supplierTable.id, supplierId))
      .then((rows) => rows[0]);

    if (!result) {
      return { success: false, message: 'Supplier not found' };
    }

    const { supplier } = result;

    const [spendCategories, industries, countries, companySizes] =
      await Promise.all([
        getSpendCategories(),
        getIndustries(),
        getCountries(),
        getCompanySizes(),
      ]);

    if (!spendCategories || !industries || !countries || !companySizes) {
      return { success: false, message: 'Failed to fetch lookup data' };
    }

    const supplierDetailLookupData: SupplierDetailsLookupData = {
      spendCategories,
      industries,
      countries,
      companySizes,
    };

    const supplierAdditionalContacts = await db
      .select()
      .from(supplierAdditionalContactsTable)
      .where(eq(supplierAdditionalContactsTable.supplierId, supplier.id));

    const supplierDetails: QuestionnaireSupplierDetails = {
      supplierId: supplier.id,
      submissionId: submission.data.submissionId,
      questionnaireId: submission.data.questionnaireId,
      questionnaireName: submission.data.questionnaireName,
      name: supplier.name,
      registrationNumber: supplier.registrationNumber,
      countryId: supplier.countryId ?? 0,
      industryId: supplier.industryId ?? 0,
      address: supplier.address,
      website: supplier.website ?? '',
      companySizeId: supplier.companySizeId ?? 0,
      primaryContactName: supplier.primaryContactName,
      primaryContactPosition: supplier.primaryContactPosition,
      primaryContactEmail: supplier.primaryContactEmail,
      primaryContactPhone: supplier.primaryContactPhone,
      mainProductType: supplier.mainProductType ?? '',
      fteHeadcount: supplier.fteHeadcount ?? 0,
      annualSpend: supplier.annualSpend ?? 0,
      peakSeason: supplier.peakSeason ?? '',
      lowSeason: supplier.lowSeason ?? '',
      spendCategoryId: supplier.spendCategoryId ?? 0,
      affidavitWaiverName: supplier.affidavitWaiverName ?? '',
      affidavitWaiverSurname: supplier.affidavitWaiverSurname ?? '',
      affidavitWaiverSignature: supplier.affidavitWaiverSignature ?? '',
      affidavitWaiverConfirmation: supplier.affidavitWaiverConfirmation,
      supplierAdditionalContacts: supplierAdditionalContacts.map((contact) => ({
        id: contact.id,
        supplierId: contact.supplierId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        sectionId: contact.sectionId,
      })),
      supplierDetailLookupData,
    };

    return {
      success: true,
      data: supplierDetails,
      message: 'Supplier fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    return { success: false, message: 'Error fetching supplier by ID' };
  }
}

export async function updateSupplier(
  supplierId: number,
  supplierFormData: QuestionnaireSupplierFormData
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!supplierFormData) {
      return { success: false, message: 'Invalid supplier details provided' };
    }

    const result = await db
      .update(supplierTable)
      .set({
        name: supplierFormData.name,
        registrationNumber: supplierFormData.registrationNumber,
        countryId: supplierFormData.countryId,
        industryId: supplierFormData.industryId,
        address: supplierFormData.address,
        website: supplierFormData.website,
        companySizeId: supplierFormData.companySizeId,
        primaryContactName: supplierFormData.primaryContactName,
        primaryContactPosition: supplierFormData.primaryContactPosition,
        primaryContactEmail: supplierFormData.primaryContactEmail,
        primaryContactPhone: supplierFormData.primaryContactPhone,
        fteHeadcount: supplierFormData.fteHeadcount,
        annualSpend: supplierFormData.annualSpend,
        spendCategoryId: supplierFormData.spendCategoryId,
        affidavitWaiverName: supplierFormData.affidavitWaiverName,
        affidavitWaiverSurname: supplierFormData.affidavitWaiverSurname,
        affidavitWaiverSignature: supplierFormData.affidavitWaiverSignature,
        affidavitWaiverConfirmation:
          supplierFormData.affidavitWaiverConfirmation,
        mainProductType: supplierFormData.mainProductType,
        peakSeason: supplierFormData.peakSeason,
        lowSeason: supplierFormData.lowSeason,
      })
      .where(eq(supplierTable.id, supplierId));

    if (!result) {
      return { success: false, message: 'Failed to update supplier' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, message: 'Failed to update supplier' };
  }
}

export async function removeSupplierAdditionalContact(id: number) {
  await db.transaction(async (tx) => {
    const [deletedUser] = await tx
      .delete(supplierAdditionalContactsTable)
      .where(eq(supplierAdditionalContactsTable.id, id))
      .returning({
        userId: supplierAdditionalContactsTable.userId,
      });

    if (deletedUser.userId) {
      try {
        await deleteUserById(deletedUser.userId, tx);
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    }
  });
}

export async function saveSupplierAdditionalContacts(
  contacts: SupplierAdditionalContacts[]
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!contacts || contacts.length === 0) {
      return { success: false, message: 'No contacts provided' };
    }

    for (const contact of contacts) {
      let user = await getUserByEmail(contact.email);

      user ??= await createUser(contact.email, 'supplier_additional_admin', {
        supplierId: contact.supplierId,
      });

      if (!user?.id) {
        throw new Error('Failed to find or create user');
      }

      await db
        .insert(supplierAdditionalContactsTable)
        .values({
          id: contact.id ?? undefined,
          userId: user.id,
          supplierId: contact.supplierId,
          name: contact.name,
          role: contact.role,
          email: contact.email,
          sectionId: contact.sectionId,
        })
        .onConflictDoUpdate({
          target: [supplierAdditionalContactsTable.id],
          set: {
            name: contact.name,
            role: contact.role,
            email: contact.email,
            sectionId: contact.sectionId,
          },
        });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving additional contacts:', error);
    return { success: false, message: 'Failed to save additional contacts' };
  }
}
