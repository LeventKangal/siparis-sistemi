// orderQueryService

import supabase from '@/services/supabaseService.js';

async function getOrdersByUser(userMail: string) {
  // 1. Kullanıcı türünü kontrol et
  const { data: user, error: userError} = await supabase
.from('users')
.select('user_type')
.eq('email', userMail)
.maybeSingle();

  if (userError ||!user) {
    console.error('Kullanıcı bilgisi alınamadı:', userError?.message);
    return [];
}

  if (user.user_type === 'A') {
    // Admin → tüm siparişleri getir
    const { data, error} = await supabase
.from('order_items')
.select('*')
.order('supplier_id');

    if (error) {
      console.error('Admin veri çekme hatası:', error.message);
      return [];
}

    return data;
}

  // 2. Üretici ise supplier_id alınır
  const { data: supplier, error: supplierError} = await supabase
.from('suppliers')
.select('id')
.eq('email', userMail)
.maybeSingle();

  if (supplierError ||!supplier) {
    console.error('Tedarikçi bulunamadı:', supplierError?.message);
    return [];
}

  const supplierId = supplier.id;

  // 3. Üreticiye ait siparişler çekilir
  const { data, error} = await supabase
.from('order_items')
.select('*')
.eq('supplier_id', supplierId)
.order('supplier_id');

  if (error) {
    console.error('Üretici sipariş hatası:', error.message);
    return [];
}

  return data;
}

export { getOrdersByUser};