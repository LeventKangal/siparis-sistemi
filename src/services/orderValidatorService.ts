// 📦 src/services/orderValidatorService.ts

interface Product {
  name: string
  quantity: number
  max_quantity?: number
  min_quantity?: number
  stock?: number
  catalog_id?: string
  lockedByCatalog?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateProduct(
  product: Product,
  orderedCatalogs: Set<string>,
  usedCatalogs: Set<string>,
  isResetSupplier: boolean
): ValidationResult {
  const errors: string[] = []
  const miktar = parseFloat(product.quantity as any)
  const max = product.max_quantity ?? Infinity
  const min = product.min_quantity ?? 0
  const stok = product.stock ?? 0

  if (!miktar || isNaN(miktar) || miktar === 0) {
    errors.push('Geçersiz miktar girildi.')
  }

  if (product.lockedByCatalog) {
    errors.push('Katalog tarafından kilitlenmiş.')
  }

  if (min === 1 && !Number.isInteger(miktar)) {
    errors.push('Tam sayı girilmelidir.')
  }

  if (miktar < min) {
    errors.push(`Minimum sipariş miktarı ${min} olmalıdır.`)
  }

  if (miktar > max) {
    errors.push(`Maksimum sipariş miktarı ${max} sınırını aşıyor.`)
  }

  if (miktar > stok) {
    errors.push(`Stok yetersiz: mevcut ${stok}, istenen ${miktar}.`)
  }

  if (product.catalog_id) {
    const catalogKey = product.catalog_id.toString()

    if (usedCatalogs.has(catalogKey)) {
      errors.push('Aynı katalogdan bir ürün zaten seçildi.')
    }

    if (orderedCatalogs.has(catalogKey) && !isResetSupplier) {
      errors.push('Bu katalogdan daha önce sipariş verilmiş.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
