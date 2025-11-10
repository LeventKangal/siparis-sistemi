import { createGenericService} from '@/services/genericService.js';

export interface Order {
  id: number;
  supplier_id?: number;
  product_id?: number;
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  meet_id?: string;
}

export const orderListService = createGenericService<Order>('order_items', 'id');