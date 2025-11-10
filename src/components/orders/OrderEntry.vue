<template>
  <div class="supplier-selection">
    <h2>Türetici Sipariş Girişi</h2>

    <select v-model="selectedSupplier" @change="getProducts">
      <option disabled value="">Üretici Seç</option>
      <option
        v-for="supplier in suppliers"
:key="supplier.id"
:value="supplier.id"
>
        {{ supplier.name}}
      </option>
    </select>

    <div v-if="selectedSupplier">
      <h3>Ürünler</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Detay</th>
            <th style="width: 190px;">Ürün Adı</th>
            <th style="width: 130px;">Birim</th>
            <th style="width: 100px; text-align: right;">Fiyat</th>
            <th style="width: 100px; text-align: right;">Miktar</th>
            <th style="width: 80px; text-align: right;">Stok</th>
            <th style="width: 180px;">Açıklama</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="product in products":key="product.id">
            <tr
:class="{
                'out-of-stock': product.stock === 0 || product.stock === null,
                'already-ordered-row': product.alreadyOrdered,
                'locked-row': product.lockedByCatalog
}"
>
              <td>
                <button @click="toggleDetail(product.id)">🔍 Detay</button>
              </td>
              <td :title="product.name || ''">
                {{ typeof product.name === 'string'? product.name.substring(0, 30): ''}}
              </td>
              <td style="text-align: left;">{{ product.unit}}</td>
              <td style="text-align: right;">{{ product.price}} ₺</td>
              <td>
                <input
                  type="text"
                  class="miktar-input"
                  v-model="product.quantityInput"
                  @input="handleInput(product)"
                  inputmode="decimal"
:max="Math.min(product.max_quantity, product.stock)"
:disabled="product.stock === 0 ||  product.stock === null || product.alreadyOrdered || product.lockedByCatalog"
                  step="any"
                />
                <p v-if="product.inputWarning" class="warning">{{ product.inputWarning}}</p>

              </td>
              <td style="text-align: right;":class="{ 'highlight-stock': product.stock> 20}">
                {{ product.stock> 20? '+20': product.stock}}
              </td>

             <td>
           <p v-if="product.lockedByCatalog" class="warning" style="color: red;">
      🔒 <span>Bu ürün grubundan zaten sipariş verdiniz</span>
          </p>

          <p v-if="product.alreadyOrdered" class="warning" style="color: red;">
      ⚠️ <span> Daha önce sipariş edildi</span>
          </p>

          <p v-if="product.stock === 0" class="warning" style="color: red;">
          ⛔ <span>Bu üründen stok yok!</span>
         </p>

          <p v-if="product.stock === null" class="warning" style="color: lightblue;">
          🗑️ <span>Üretici stok bilgisi girmemiş!</span>
          </p>
  </td>


            </tr>

            <tr v-if="expandedProductId === product.id">
              <td colspan="7" class="product-description-row">
                <strong>Tanım:</strong> {{ product.description}}
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Tablonun hemen altına mesajları koy -->

      <!-- Genel başarı mesajı -->
           <div v-if="successMessage" class="success-alert"> {{ successMessage}}  </div>

<!-- Genel hata mesajı -->
<div v-if="errorMessage" class="error-alert"> {{ errorMessage}} </div>

<!-- Ürün bazlı detaylı hatalar -->
<div v-if="detailedErrors.length" class="error-list">
     <ul>
    <li v-for="(msg, index) in detailedErrors":key="index"> {{ msg}} </li>
    </ul>
</div>
       <div v-if="isSubmitting" class="spinner-container">  <div class="spinner"></div>
           <p>Siparişler gönderiliyor...</p>
       </div>
      <!-- Sonra buton -->
      <button
        class="submit-btn"
        v-if="products.length> 0"
        style="margin-left: 20px;"
        @click="handleSubmitOrder">Tüm Siparişleri Gönder
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import supabase from '@/services/supabaseService'
import { submitOrder } from '@/services/orderService'

const successMessage = ref('')
const errorMessage = ref('')
const suppliers = ref([])
const products = ref([])
const selectedSupplier = ref('')
const expandedProductId = ref(null)
const detailedErrors = ref([])

const companyName = localStorage.getItem('companyName') || ''
const meetId = localStorage.getItem('meetId') || ''
const userMail = localStorage.getItem('userEmail') || ''
const userName = localStorage.getItem('userName') || 'Bilinmeyen'

const orderedCatalogs = ref(new Set())
const isSubmitting = ref(false)

// 🔍 Ürün doğrulama fonksiyonu
function validateProduct(p): string | null {
  const miktar = parseFloat(p.quantity)
  const max = p.max_quantity ?? Infinity
  const min = p.min_quantity ?? 0
  const stok = p.stock ?? 0

  if (!miktar || isNaN(miktar) || miktar === 0) return 'Geçersiz miktar girildi.'
  if (p.lockedByCatalog) return 'Katalog tarafından kilitlenmiş.'
  if (min === 1 && !Number.isInteger(miktar)) return 'Tam sayı girilmelidir.'
  if (miktar < min) return `Minimum sipariş miktarı ${min} olmalıdır.`
  if (miktar > max) return `Maksimum sipariş miktarı ${max} sınırını aşıyor.`
  if (miktar > stok) return `Stok yetersiz: mevcut ${stok}, istenen ${miktar}.`

  return null
}

// 🧾 Hata loglama
async function logError(product, message) {
  const logEntry = {
    company_name: companyName,
    user_mail: userName,
    meet_id: meetId,
    supplier_id: product.supplier_name,
    product_id: product.name,
    action: 'error',
    details: {
      user_name: userName,
      supplier_id: product.supplier_name,
      quantity: product.quantity,
      error: typeof message === 'string' ? message : JSON.stringify(message)
    }
  }

  await supabase.from('order_logs').insert([logEntry])
  detailedErrors.value.push(logEntry.details.error)
}

// 📱 Virgül düzeltme
function handleInput(product) {
  let raw = product.quantityInput
  if (raw.includes(',')) {
    raw = raw.replace(',', '.')
    product.quantityInput = raw
  }

  const parsed = parseFloat(raw)
  if (isNaN(parsed)) {
    product.inputWarning = 'Geçersiz sayı girdiniz.'
    setTimeout(() => (product.inputWarning = ''), 5000)
    return
  }

  product.quantity = parsed
}

// 📦 Sipariş edilen katalogları getir
async function fetchOrderedCatalogs() {
  const { data, error } = await supabase
    .from(`order_items_${companyName}`)
    .select('catalog_id')
    .eq('user_mail', userMail)
    .eq('meet_id', meetId)
    .not('catalog_id', 'is', null)
    .neq('catalog_id', '')

  if (!error && data) {
    orderedCatalogs.value = new Set(data.map(item => item.catalog_id))
  }
}

// 🚚 Ürünleri getir
async function getProducts() {
  if (!selectedSupplier.value || !companyName) return

  await fetchOrderedCatalogs()

  const { data: allProducts } = await supabase
    .from(`products_${companyName}`)
    .select('id, name, description, price, isActive, stock, unit, max_quantity, min_quantity, catalog_id, display_order, supplier_name, supplier_id')
    .eq('supplier_id', selectedSupplier.value)
    .eq('isActive', true)
    .order('display_order', { ascending: true })

  const { data: orderedItems } = await supabase
    .from(`order_items_${companyName}`)
    .select('product_id, quantity')
    .eq('user_mail', userMail)
    .eq('meet_id', meetId)
    .eq('supplier_id', selectedSupplier.value)

  const orderedMap = {}
  for (const item of orderedItems || []) {
    orderedMap[item.product_id] = item.quantity
  }

  products.value = allProducts.map(product => {
    const alreadyOrdered = product.id in orderedMap
    const isCatalogAlreadyOrdered = orderedCatalogs.value.has(product.catalog_id)
    return {
      ...product,
      quantity: orderedMap[product.id] ?? 0,
      quantityInput: String(orderedMap[product.id] ?? 0),
      inputWarning: '',
      alreadyOrdered,
      lockedByCatalog: isCatalogAlreadyOrdered
    }
  })
}

// 🧾 Sipariş gönderimi
async function handleSubmitOrder() {
  let successCount = 0
  let failCount = 0
  const usedCatalogs = new Set()
  let hasError = false

  isSubmitting.value = true

  const validProducts = products.value.filter(p => {
    const miktar = parseFloat(p.quantity)
    return miktar > 0 && !p.alreadyOrdered && !p.lockedByCatalog
  })

  for (const p of validProducts) {
    if (p.catalog_id && usedCatalogs.has(p.catalog_id)) {
      await logError(p, `🚫 "${p.name}" aynı sipariş içinde zaten seçildi.`)
      p.quantity = 0
      p.quantityInput = '0'
      hasError = true
      continue
    }

    const error = validateProduct(p)
    if (error) {
      await logError(p, `🚫 "${p.name}" ${error}`)
      p.quantity = 0
      p.quantityInput = '0'
      hasError = true
      continue
    }

    if (p.catalog_id) {
      usedCatalogs.add(p.catalog_id.toString())
    }

    try {
      const result = await submitOrder(
        [p],
        p.supplier_id,
        userMail,
        meetId,
        companyName
      )

      if (result.success) {
        successCount++
        p.quantity = 0
        p.quantityInput = '0'
        if (Array.isArray(result.error)) {
          detailedErrors.value.push(...result.error)
        }
      } else {
        failCount++
        await logError(p, result.error || 'Sipariş gönderilemedi.')
      }
    } catch (err) {
      failCount++
      await logError(p, err?.message || 'Sipariş sırasında hata oluştu.')
    }
  }

  if (successCount > 0) {
    successMessage.value = `✅ ${successCount} ürün başarıyla sipariş edildi.`
  }

  if (failCount > 0) {
    errorMessage.value = `⚠️ ${failCount} ürün gönderilemedi.`
  }

  if (successCount === 0 && failCount === 0 && validProducts.length === 0) {
    const noOrderMessage = '📦 Siparişe uygun ürün bulunamadı.'
    errorMessage.value = noOrderMessage
    await logError({ name: 'N/A', supplier_id: null, id: null }, noOrderMessage)
  }

  isSubmitting.value = false

  setTimeout(() => {
    successMessage.value = null
    errorMessage.value = null
    detailedErrors.value = []
  }, 5000)
}

// 🔄 Ürün detaylarını aç/kapat
function toggleDetail(id) {
  expandedProductId.value = expandedProductId.value === id ? null : id
}

// 🚀 Tedarikçileri getir
onMounted(async () => {
  if (!companyName) return

  const { data, error } = await supabase
    .from(`suppliers_${companyName}`)
    .select('id, name, isActive')
    .eq('isActive', true)
    .order('id', { ascending: true })

  if (!error) suppliers.value = data
})
</script>


<style scoped>

.spinner-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #ccc;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg);}
}

.locked-row {
  background-color: #f9e0e0;
}
.warning {
  font-size: 0.85em;
  margin-top: 4px;
}

.supplier-selection {
  font-family: 'Segoe UI', sans-serif;
  padding: 20px;
  max-width: 1000px; /* Sayfa genişliğini sınırlamak hizalamayı kolaylaştırır */
  margin: 0 auto;     /* Ortalamak için */
}

h2, h3 {
  font-family: 'Segoe UI', sans-serif;
  color: blue;
  font-weight: normal;
  margin-left: 0; /* Tabloyla hizalanması için */
  padding-left: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed; /* Sabit kolon genişlikleri için */
}

th, td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


thead th {
  background-color: #3498db;
  color: white;
  text-align: left;
}

/* Kolon genişliklerini daha dengeli ayarladım */
th:nth-child(1), td:nth-child(1) {
  width: 50px;
}

td:first-child button {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

th:nth-child(2), td:nth-child(2) {
  width: 200px;
}

th:nth-child(3), td:nth-child(3) {
  width: 100px;
}

th:nth-child(4), td:nth-child(4),
th:nth-child(5), td:nth-child(5),
th:nth-child(6), td:nth-child(6) {
  width: 100px;
  text-align: right;
}

th:nth-child(7), td:nth-child(7) {
  width: 220px;
}

.miktar-input {
  width: 80px;
  padding: 5px;
  text-align: center;
  font-size: 14px;
}

.out-of-stock {
  background-color: #f8d7da;
}

.already-ordered-row {
  background-color: #ebe6e6;
}

.highlight-stock {
  font-weight: bold;
  color: green;
}

.product-description-row {
  background-color: #f0f8ff;
  white-space: normal;
  font-style: italic;
  padding: 10px;
}

.submit-btn {
  background-color: #2ecc71;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
}

.success-alert,.error-alert {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
}

.success-alert {
  color: #155724;
  background-color: #d4edda;
}

.error-alert {
  color: #721c24;
  background-color: #f8d7da;
}

.error-list ul {
  list-style: none;
  padding-left: 0;
}

.error-list li {
  background-color: #fff0f0;
  color: #b71c1c;
  margin-bottom: 4px;
  padding: 6px;
  border-radius: 3px;
}


.warning {
  color: red;
  font-size: 0.9rem;
  margin-top: 4px;
  max-width: 220px; /* input genişliği kadar */
  word-wrap: break-word;
  white-space: normal;
}

</style>
