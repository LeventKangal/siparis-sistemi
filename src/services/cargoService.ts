import { createGenericService} from '@/services/genericService.js';



export interface Cargo {
  supplier_id: number
  meet_id: string
  total_charge?: number
  total_unit?: number
  unit_charge?: number
  isReady?: boolean
  product_id?: number
}

// Tablo adı: cargo_<companyName>
export const cargoService = createGenericService<Cargo>('cargo', ['supplier_id', 'meet_id'])

