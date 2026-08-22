import { EvaluationRiskLevel, EvaluationStatus } from '@/enums/evaluation';
import { parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs/server';

export const supplierSearchParams = {
  search: parseAsString.withDefault(''),
  spendCategory: parseAsString.withDefault('all'),
  industry: parseAsString.withDefault('all'),
  country: parseAsString.withDefault('all'),
  riskLevel: parseAsStringEnum(Object.values(EvaluationRiskLevel)).withDefault(
    EvaluationRiskLevel.ALL
  ),
  completionStatus: parseAsStringEnum(
    Object.values(EvaluationStatus)
  ).withDefault(EvaluationStatus.ALL),
  page: parseAsInteger.withDefault(1),
};
