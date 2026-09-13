export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  taxId: string | null;
  paymentTerms: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string;
  taxId?: string | null;
  paymentTerms?: string;
  status?: string;
  notes?: string | null;
}
