import { createGenericService} from '@/services/genericService.js';

export interface Supplier {
  id: number;
  supplier_name?: string;
  location?: string;
  isActive?: boolean;
  name?: string;
  email?: string;
}

export const supplierService = createGenericService<Supplier>('suppliers', 'id');