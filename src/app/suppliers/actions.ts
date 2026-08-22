'use server';

import {
  parseSupplierCsv,
  insertSupplierData,
} from '@/server/services/supplier.service';
import { type SupplierRow } from '@/types/supplier-data';

export async function parseSupplierCsvAction(formData: FormData) {
  return await parseSupplierCsv(formData);
}

export async function insertSupplierDataAction(
  parsedData: SupplierRow[],
  companyId: number
) {
  return await insertSupplierData(parsedData, companyId);
}
