import { createGenericService} from '@/services/genericService.js';


export interface Product {
  id: number;
  supplier_name?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  created_at?: string;
  supplier_id?: string;
  unit?: string;
  isActive?: boolean;
  max_quantity?: number;
  min_quantity?: number;
  catalog_id?: string; // 
}

export const productService = createGenericService<Product>('products', 'id');
