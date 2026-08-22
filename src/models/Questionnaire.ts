export interface CompanyInfo {
  name: string;
  registrationNumber: string;
  industry: string;
  country: string;
  address: string;
  website: string;
  companySize: string;
  annualSpend: number;
  fteHeadcount: number;
  contactName: string;
  contactPosition: string;
  contactEmail: string;
  contactPhone: string;
  signerName: string;
  signerSurname: string;
  affidavitWaiver: boolean;
  signature: string | null;
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  email: string;
  sectionTitle: string;
}

export interface CompanyDetailsStepProps {
  companyInfo: CompanyInfo;
  errors: Record<string, boolean>;
  attemptedSubmit: boolean;
  onCompanyChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSignatureChange: (signatureData: string | null) => void;
  onNext: (e: React.FormEvent) => void;
}

export interface ContactsStepProps {
  contacts: Contact[];
  onAddContact: () => void;
  onRemoveContact: (id: number) => void;
  onUpdateContact: (id: number, field: string, value: string) => void;
  onSave: () => void;
}
