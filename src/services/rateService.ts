import supabase from '@/services/supabaseService.js';

export interface Rate {
  id: number;
  min_value: number;
  rate: number;
}

const companyName = localStorage.getItem('companyName') || '';
const tableName = `rates_${companyName}`;

console.log('tableName', tableName);

// 🔁 rateService nesnesi
export const rateService = {
  async getAll(): Promise<Rate[]> {
    const { data, error} = await supabase.from(tableName).select('*');
    if (error ||!data) {
      console.warn('❌ Tüm oranlar alınamadı:', error);
      return [];
}
    return data;
},

  async insertOne(rate: Omit<Rate, 'id'>): Promise<Rate | null> {
    const { data, error} = await supabase.from(tableName).insert(rate).select().single();
    if (error ||!data) {
      console.warn('❌ Yeni oran eklenemedi:', error);
      return null;
}
    return data;
},

  async updateById(id: number, rate: Partial<Rate>): Promise<Rate | null> {
    const { data, error} = await supabase.from(tableName).update(rate).eq('id', id).select().single();
    if (error ||!data) {
      console.warn('❌ Oran güncellenemedi:', error);
      return null;
}
    return data;
},

  async deleteById(id: number): Promise<boolean> {
    const { error} = await supabase.from(tableName).delete().eq('id', id);
    return!error;
},
};

// 🎯 Bağımsız oran çekme fonksiyonu
export async function fetchRateForAmount(amount: number): Promise<number> {

  const { data, error} = await supabase
.from(tableName)
.select('rate, min_value')
.lte('min_value', amount)
.order('min_value', { ascending: false})
.limit(1);

  if (error) {
    console.warn('❌ Supabase hata:', error.message);
}

  if (!data || data.length === 0) {
    console.warn('⚠️ Uygun oran bulunamadı. Gelen veri:', data);
    return 0;
}

  console.log('✅ Eşleşen oran:', data[0]);
  return data[0].rate;
}
