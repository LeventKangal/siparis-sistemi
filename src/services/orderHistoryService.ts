// 📦 src/services/orderHistoryService.ts
import supabase from './supabaseService'

export async function fetchOrderedCatalogs(
  companyName: string,
  userMail: string,
  meetId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(`order_items_${companyName}`)
    .select('catalog_id')
    .eq('user_mail', userMail)
    .eq('meet_id', meetId)
    .not('catalog_id', 'is', null)
    .neq('catalog_id', '')

  if (error || !data) {
    console.warn('⚠️ Sipariş geçmişi alınamadı:', error)
    return new Set()
  }

  return new Set(data.map(item => item.catalog_id))
}
