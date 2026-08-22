import {
  type EvaluationRiskLevel,
  type EvaluationStatus,
} from '@/enums/evaluation';

export type CompanySupplierSummary = {
  id: number;
  name: string;
  industry: string;
  riskLevel: EvaluationRiskLevel;
  lastEvaluation: string;
  dueDate: string;
  currentEvaluationScore: number;
  evaluationProgress: number;
  country: string;
  status: string;
  verified: boolean;
  evaluationScore: number;
  spendCategory: string;
  completionStatus: EvaluationStatus;
  wasAutoSubmitted: boolean;
  wasManuallySubmitted: boolean;
  primaryContactName: string;
  primaryContactEmail: string;
  dateInviteSent: string;
};

export type QuestionnaireSupplierDetails = {
  supplierId: number;
  submissionId: number;
  questionnaireId: number;
  questionnaireName: string;
  name: string;
  registrationNumber: string;
  countryId: number;
  industryId: number;
  address: string;
  website?: string;
  companySizeId: number;
  primaryContactName: string;
  primaryContactPosition: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  mainProductType: string;
  annualSpend: number;
  fteHeadcount: number;
  peakSeason: string;
  lowSeason: string;
  spendCategoryId: number;
  affidavitWaiverName?: string;
  affidavitWaiverSurname?: string;
  affidavitWaiverSignature?: string;
  affidavitWaiverConfirmation: boolean;
  supplierAdditionalContacts?: SupplierAdditionalContacts[];
  supplierDetailLookupData?: SupplierDetailsLookupData;
};

export type SupplierAdditionalContacts = {
  id?: number;
  supplierId: number;
  name: string;
  role: string;
  email: string;
  sectionId: number | null;
};

export type SupplierDetailsLookupData = {
  spendCategories: SpendCategory[];
  industries: Industry[];
  countries: Country[];
  companySizes: CompanySize[];
};

export type CreateSupplierDetails = {
  companyId: number;
  name: string;
  registrationNumber: string;
  industryId?: number;
  countryId?: number;
  address?: string;
  website?: string;
  companySizeId?: number;
  annualSpend?: number;
  fteHeadcount?: number;
  primaryContactName: string;
  primaryContactPosition?: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  additionalNotes?: string;
  spendCategoryId?: number;
  peakSeason?: string;
  status?: string;
};

export type SupplierDetails = {
  name: string;
  verified: boolean;
  industry: string;
  address: string;
  annualSpend: number;
  fteHeadcount: number;
  primaryContactEmail: string;
  primaryContactPhone: string;
  spendCategory: string;
  registrationDate: string;
  lastEvaluationDate: string;
  evaluationStatus: EvaluationStatus;
  mainProductType: string;
  peakSeason: string;
  lowSeason: string;
  aggregatedScoreDetails: AggregatedScoreDetails;
};

export type SupplierLatestSubmission = {
  isSubmitted: boolean;
  id: number;
  dueDate?: Date | null;
};

export type AggregatedScoreDetails = {
  score: number;
  changePercentage: number;
  riskLevel: EvaluationRiskLevel;
  findings?: {
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  evaluationStatus: EvaluationStatus;
};

export type SpendCategory = {
  id: number;
  category1: string;
};

export type Industry = {
  id: number;
  name: string;
};

export type Country = {
  id: number;
  name: string;
};

export type CompanySize = {
  id: number;
  name: string;
};

export interface SuppliersPastEvaluation {
  id: number;
  year: number;
  questionnaireName: string;
  version: number;
  startDate: string;
  completionDate: string;
  overallScorePercent: number;
  sections: Array<{ title: string; percent: number }>;
}

export interface SuppliersPastEvaluationsProps {
  supplierId: number;
  evaluations: SuppliersPastEvaluation[];
}

export interface SuppliersFormData {
  companyName: string;
  registrationNumber: string;
  industry: string;
  country: string;
  address: string;
  website: string;
  companySize: string;
  contactName: string;
  position: string;
  email: string;
  phoneNumber: string;
  additionalNotes: string;
}

export type SuppliersFormErrors = Record<string, string>;
