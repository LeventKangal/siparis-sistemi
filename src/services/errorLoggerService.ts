// 📦 src/services/errorLoggerService.ts
import supabase from './supabaseService'

interface LogContext {
  companyName: string
  meetId: string
  userMail: string
  userName: string
}

interface Product {
  name: string
  supplier_name?: string
  quantity?: number
  id?: string
}

export async function logError(
  product: Product,
  message: string,
  context: LogContext
): Promise<void> {
  const logEntry = {
    company_name: context.companyName,
    user_mail: context.userName,
    meet_id: context.meetId,
    supplier_id: product.supplier_name ?? null,
    product_id: product.name ?? null,
    action: 'error',
    details: {
      user_name: context.userName,
      supplier_id: product.supplier_name ?? null,
      quantity: product.quantity ?? null,
      error: typeof message === 'string' ? message : JSON.stringify(message)
    }
  }

  try {
    await supabase.from('order_logs').insert([logEntry])
  } catch (err) {
    console.error('❌ Hata loglanamadı:', err)
  }
}
