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
            <th style="width: 60px;">Detay</th>
            <th style="width: 150px;">Ürün Adı</th>
            <th style="width: 80px;">Birim</th>
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

          <p v-if="product.lockedByReset" class="warning" style="color: black;">
            ⛔ <span>Bu ürün KAPALI</span>
           </p>
          <p v-else-if="product.stock === 0" class="warning" style="color: red;">
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
      <div v-if="successMessage" class="success-alert">
        {{ successMessage}}
      </div>
      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage}}
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

<script setup>

import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { submitOrder} from '@/services/orderService';
import { validateProduct} from '@/services/orderValidatorService';
import { logError} from '@/services/errorLoggerService';
import { getProductsForSupplier} from '@/services/supplierProductsService';
import { fetchOrderedCatalogs} from '@/services/orderHistoryService';

const successMessage = ref('');
const errorMessage = ref('');
const suppliers = ref([]);
const products = ref([]);
const selectedSupplier = ref('');
const expandedProductId = ref(null);
const isSubmitting = ref(false);

const companyName = localStorage.getItem('companyName') || '';
const meetId = localStorage.getItem('meetId') || '';
const userMail = localStorage.getItem('userEmail') || '';
const userName = localStorage.getItem('userName') || 'Bilinmeyen';

const orderedCatalogs = ref(new Set());

function handleInput(product) {
  let raw = product.quantityInput;
  if (raw.includes(',')) {
    raw = raw.replace(',', '.');
    product.quantityInput = raw;
}

  const parsed = parseFloat(raw);
  if (isNaN(parsed)) {
    product.inputWarning = 'Geçersiz sayı girdiniz.';
    setTimeout(() => (product.inputWarning = ''), 5000);
    return;
}

  product.quantity = parsed;
}

async function verifyLatestStock(productId) {
  const { data, error} = await supabase
.from(`products_${companyName}`)
.select('stock')
.eq('id', productId)
.single();

  if (error ||!data) return null;
  return data.stock;
}

async function getProducts() {
  const catalogSet = await fetchOrderedCatalogs(companyName, userMail, meetId);

  orderedCatalogs.value = await fetchOrderedCatalogs(companyName, userMail, meetId);

  const result = await getProductsForSupplier({
    companyName,
    selectedSupplier: selectedSupplier.value,
    userMail,
    meetId,
    orderedCatalogs: catalogSet
});

  products.value = result;
}

async function handleSubmitOrder() {
  let successCount = 0;
  let failCount = 0;
  let lastErrorMessage = '';
  const usedCatalogs = new Set();
  let hasError = false;

  isSubmitting.value = true;

  const validProducts = products.value.filter(p => parseFloat(p.quantity)> 0);

  const { data: resetData, error: resetError} = await supabase
.from('reset_logs')
.select('supplier_id')
.eq('company_name', companyName)
.eq('status', 'success')
.eq('supplier_id', selectedSupplier.value);

  const isResetSupplier =!resetError && resetData?.length> 0;

  for (const p of validProducts) {
    const latestStock = await verifyLatestStock(p.id);

    if (latestStock === null) {
      await logError(p, 'Stok bilgisi BOŞ. Sipariş iptal edildi.', {
        companyName,
        meetId,
        userMail,
        userName
});

      failCount++;

      continue;
}

    if (latestStock < p.quantity) {
      await logError(p, `Stok yetersiz. Mevcut: ${latestStock}, İstenen: ${p.quantity}`,
      {
        companyName,
        meetId,
        userMail,
        userName
});
      p.quantity = 0;
      p.quantityInput = '0';

      failCount++;

      continue;
}

    const result = validateProduct(p, orderedCatalogs.value, usedCatalogs, isResetSupplier);

    if (!result.isValid) {
      failCount++;

      for (const msg of result.errors) {
        await logError(p, msg, { companyName, meetId, userMail, userName});
}
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
      continue;
}

    usedCatalogs.add(p.catalog_id);

    try {
      const result = await submitOrder([p], p.supplier_id, userMail, meetId, companyName);

      if (result.success) {
        successCount++;
        p.quantity = 0;
        p.quantityInput = '0';
} else {
        failCount++;
        lastErrorMessage = result.error || 'Sipariş gönderilemedi.';
        await logError(p, lastErrorMessage, { companyName, meetId, userMail, userName});
}
} catch (err) {
      failCount++;
      const fallbackMessage = err?.message || 'Sipariş sırasında hata oluştu.';
      await logError(p, fallbackMessage, { companyName, meetId, userMail, userName});
}
}

  if (successCount> 0) {
    successMessage.value = `✅ ${successCount} ürün başarıyla sipariş edildi.`;
    setTimeout(() => (successMessage.value = null), 4000);
}

  if (failCount> 0) {
    errorMessage.value = `⚠️ ${failCount} ürün gönderilemedi.`;
    setTimeout(() => (errorMessage.value = null), 6000);
}

  if (successCount === 0 && failCount === 0) {
    const noOrderMessage = `📦 Siparişe uygun ürün bulunamadı.`;
    errorMessage.value = noOrderMessage;
    setTimeout(() => (errorMessage.value = null), 4000);
    await logError({ name: 'N/A', supplier_id: null, id: null}, noOrderMessage, {
      companyName,
      meetId,
      userMail,
      userName
});
}

  isSubmitting.value = false;
}

function toggleDetail(id) {
  expandedProductId.value = expandedProductId.value === id? null: id;
}

onMounted(async () => {
  if (!companyName) return;

  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, name, isActive')
.eq('isActive', true)
.order('id', { ascending: true});

  if (!error) suppliers.value = data;
});
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

.warning {
  color: red;
  font-size: 0.9rem;
  margin-top: 4px;
  max-width: 220px; /* input genişliği kadar */
  word-wrap: break-word;
  white-space: normal;
}

</style>
