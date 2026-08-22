export {};

export type Roles =
  | 'super_admin'
  | 'client_admin'
  | 'client_additional_admin'
  | 'supplier_admin'
  | 'supplier_additional_admin'
  | 'developer';

export interface SessionPayload {
  sub: number;
  email: string;
  name?: string;
  role: Roles;
  companyId?: number;
  supplierId?: number;
}
