<template>
  <div class="product-search-order">
    <h2>Ürün Arama ve Sipariş</h2>

    <input v-model="searchTerm" placeholder="Ürün adıyla ara..." />

    <table v-if="filteredProducts.length> 0">
      <thead>
        <tr>
          <th>Ürün Adı</th>
          <th>Üretici</th>
          <th>Birim</th>
          <th>Fiyat</th>
          <th style="width: 100px; text-align: center;">Miktar</th>
          <th style="width: 80px; text-align: center;">Stok</th>
          
        </tr>
      </thead>
<tbody>
<tr
  v-for="product in filteredProducts"
:key="product.id"
:class="{
    'out-of-stock-row': product.stock === 0 || product.stock === null,
    'already-ordered-row': product.alreadyOrdered,
    'locked-row': product.lockedByCatalog
}"
>
  <td>{{ product.name}}</td>
  <td>{{ product.supplier_name}}</td>
  <td>{{ product.unit}}</td>
  <td>{{ product.price}} ₺</td>
  <td>
    <input
      class="miktar-input"
      v-model="product.quantityInput"
      @input="handleInput(product)"
:max="Math.min(product.max_quantity, product.stock)"
:disabled="product.stock === 0 || product.stock === null ||  product.alreadyOrdered || product.lockedByCatalog || product.lockedByReset"
      step="any"
      type="text"
    />
    <p v-if="product.inputWarning" class="warning">{{ product.inputWarning}}</p>
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
  <td :class="{ 'highlight-stock': product.stock> 20}" style="text-align: center;">
    {{ product.stock> 20? '+20': product.stock}}
  </td>
</tr>
</tbody>
    </table>

    <div v-if="errorMessage" class="error-alert">{{ errorMessage}}</div>

    <div v-if="successMessage" class="success-alert">{{ successMessage}}</div>

  <div v-if="detailedErrors.length" class="error-list"> 
     <ul>
       <li v-for="(msg, index) in detailedErrors":key="index"> {{ msg}} </li>
     </ul>
  </div>
    
    <div v-if="isSubmitting" class="spinner-container">
       <div class="spinner"></div>  <p>Siparişler gönderiliyor...</p>
     </div>
    <button
      class="submit-btn"
      v-if="filteredProducts.length> 0"
      @click="submitOrders"
>
      Siparişleri Gönder
    </button>
     
  </div>
</template>

<script setup>
import { ref, computed, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { submitOrder} from '@/services/orderService';

const companyName = localStorage.getItem('companyName') || '';
const meetId = localStorage.getItem('meetId') || '';
const userMail = localStorage.getItem('userEmail') || '';
const userName = localStorage.getItem('userName') || 'Bilinmeyen';

const searchTerm = ref('');
const allProducts = ref([]);
const successMessage = ref('');
const errorMessage = ref('');
const orderedCatalogs = ref(new Set());
const isSubmitting = ref(false);

const resetSuppliers = ref(new Set());

async function fetchResetSuppliers() {
  const { data, error} = await supabase
.from('reset_logs')
.select('supplier_id')
.eq('company_name', companyName)
.eq('status', 'success');

  if (!error && data) {
    resetSuppliers.value = new Set(data.map(item => item.supplier_id));
} else {
    console.error('❌ Reset logları alınamadı:', error);
}
}



// Hata loglama
const detailedErrors = ref([]);

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
      error: typeof message === 'string'? message: JSON.stringify(message)
}
};

  await supabase.from('order_logs').insert([logEntry]);

  // Ekranda göstermek için ekle
  detailedErrors.value.push(logEntry.details.error);
}


// Virgül girilen miktarları noktaya çevirir.   Iphone klavyeler için.

function handleInput(product) {
  let raw = product.quantityInput;

  // Virgül varsa otomatik olarak noktaya çevir
  if (raw.includes(',')) {
    raw = raw.replace(',', '.');
    product.quantityInput = raw;
}

  // Sayıya çevirmeyi dene
  const parsed = parseFloat(raw);

  if (isNaN(parsed)) {
    product.inputWarning = 'Geçersiz sayı girdiniz.';
    setTimeout(() => (product.inputWarning = ''), 5000);
    return;
}

  product.quantity = parsed;

}



async function fetchOrderedCatalogs() {
  const { data, error} = await supabase
.from(`order_items_${companyName}`)
.select('catalog_id')
.eq('user_mail', userMail)
.eq('meet_id', meetId);

  if (!error && data) {
    const filtered = data
.map(item => item.catalog_id)
.filter(id => id!== null && id!== '');
    orderedCatalogs.value = new Set(filtered);
}
}

let orderedItems = [];

onMounted(async () => {

  await fetchResetSuppliers(); // 🔔 önce reset verisini al


  const { data: productsData, error} = await supabase
.from(`products_${companyName}`)
.select('id, name, unit, price, stock, supplier_id, max_quantity, min_quantity, catalog_id')
.eq('isActive', true)
.order('supplier_id', { ascending: true});

  if (error ||!productsData) return;

  await fetchOrderedCatalogs();

  const { data: suppliersData} = await supabase
.from(`suppliers_${companyName}`)
.select('id, name, isActive');

  const supplierMap = {};
  for (const s of suppliersData) {
    supplierMap[s.id] = {
      name: s.name,
      isActive: s.isActive
};
}

  // ✅ Eksik olan kısım burası
  const { data: orderedData, error: orderedError} = await supabase
.from(`order_items_${companyName}`)
.select('product_id, quantity')
.eq('user_mail', userMail)
.eq('meet_id', meetId);

  if (!orderedError && orderedData) {
    orderedItems = orderedData;
}

  const orderedMap = {};
  for (const item of orderedItems || []) {
    orderedMap[item.product_id] = item.quantity;
}

  allProducts.value = productsData
.filter(p => supplierMap[p.supplier_id]?.isActive)
.map(p => {
      const isResetLocked = p.stock === 0 && resetSuppliers.value.has(p.supplier_id);
      const isLocked = orderedCatalogs.value.has(p.catalog_id);
      const alreadyOrdered = p.id in orderedMap;

      return {
...p,
        supplier_name: supplierMap[p.supplier_id]?.name || 'Bilinmiyor',
        quantity: 0,
        quantityInput: '0',
        inputWarning: '',
        lockedByCatalog: isLocked,
        lockedByReset: isResetLocked,
        alreadyOrdered,
        stock: p.stock?? null
};
});
});



const filteredProducts = computed(() => {
  const term = searchTerm.value.trim().toLocaleLowerCase('tr-TR');
  if (!term) return allProducts.value;
  return allProducts.value.filter(p =>
    typeof p.name === 'string' &&
    p.name.toLocaleLowerCase('tr-TR').includes(term)
);
});

async function submitOrders() {
  let successCount = 0;
  let failCount = 0;
  let lastErrorMessage = '';
  const usedCatalogs = new Set();
  let hasError = false;

  isSubmitting.value = true;

  const validProducts = allProducts.value.filter(p => {
  const miktar = parseFloat(p.quantity);
  return (
    miktar> 0 &&
!p.alreadyOrdered &&
!p.lockedByCatalog &&
!p.lockedByReset
);
});


  for (const p of validProducts) {
    const miktar = parseFloat(p.quantity);
    const max = p.max_quantity?? Infinity;
    const min = p.min_quantity?? 0;
    const stok = p.stock?? 0;

    if (!miktar || isNaN(miktar) || miktar === 0) continue;

    // 🔒 Katalog kilidi kontrolü
    if (p.lockedByCatalog) {
      await logError(p, `🚫 "${p.name}" katalog tarafından kilitlenmiş.`);
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
      continue;
}

    // 🔁 Aynı sipariş içinde tekrar kontrolü
    if (p.catalog_id && usedCatalogs.has(p.catalog_id)) {
      await logError(p, `🚫 "${p.name}" aynı sipariş içinde zaten seçildi.`);
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
      continue;
}

    if (miktar < min) {
  await logError(p, `🚫 "${p.name}" için minimum sipariş miktarı ${min}`);
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
  continue;
}

if (miktar> max) {
  await logError(p, `🚫 "${p.name}" için maksimum sipariş miktarı ${max}`);
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
  continue;
}

if (miktar> stok) {
  await logError(p, `🚫 "${p.name}" için stok yetersiz: mevcut ${stok}, istenen ${miktar}`);
      p.quantity = 0;
      p.quantityInput = '0';
      hasError = true;
  continue;
}

if (min === 1 &&!Number.isInteger(miktar)) {
  await logError(p, `🚫 "${p.name}" için tam sayı girilmelidir`);
   p.quantity = 0;
   p.quantityInput = '0';
   hasError = true;
  continue;
}

    usedCatalogs.add(p.catalog_id);

    // ✅ Siparişi gönder
    try {
      const result = await submitOrder(
        [p],
        p.supplier_id,
        userMail,
        meetId,
        companyName
);

      if (result.success) {
        successCount++;
        p.quantity = 0;
        p.quantityInput = '0';
        
        // 🔔 Eğer hata mesajları varsa detaylara ekle
    if (Array.isArray(result.error)) {
      detailedErrors.value.push(...result.error);
}

} else {
        failCount++;

        if (result.error) {
          if (typeof result.error === 'string') {
            lastErrorMessage = result.error;
} else if (Object.keys(result.error).length === 0) {
            lastErrorMessage = 'Hata nesnesi boş geldi.';
} else if (result.error.message) {
            lastErrorMessage = result.error.message;
} else {
            lastErrorMessage = JSON.stringify(result.error);
}
} else {
          lastErrorMessage = 'Sipariş gönderilemedi.';
}

        await logError(p, lastErrorMessage);
}
} catch (err) {
      failCount++;
      const fallbackMessage = err?.message || 'Sipariş sırasında hata oluştu.';
      await logError(p, fallbackMessage);
}
}

  // 🔔 Genel durum mesajları
  if (successCount> 0) {
    successMessage.value = `✅ ${successCount} ürün başarıyla sipariş edildi.`;
    setTimeout(() => (successMessage.value = null), 4000);
}

  if (failCount> 0) {
    errorMessage.value = `⚠️ ${failCount} ürün gönderilemedi.`;
    setTimeout(() => (errorMessage.value = null), 6000);
}

  if (successCount === 0 && failCount === 0 && validProducts.length === 0 ) {
    const noOrderMessage = '📦 Siparişe uygun ürün bulunamadı.';
    errorMessage.value = noOrderMessage;
    setTimeout(() => (errorMessage.value = null), 4000);
    await logError({ name: 'N/A', supplier_id: null, id: null}, noOrderMessage);
}

  isSubmitting.value = false;
  setTimeout(() => {
  successMessage.value = null;
  errorMessage.value = null;
  detailedErrors.value = [];
}, 5000);

}


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


.locked-warning {
  color: #6d0303;
  font-size: 0.8em;
  display: block;
  margin-top: 4px;
}

.locked-row {
  background-color: #f9e6e6;
}


.warning {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 4px;
  display: block;
}


h2, h3 {
  font-family: 'Segoe UI', sans-serif;
  color: blue;
  font-weight: normal;
  margin-left: 0; 
  padding-left: 0;
  margin-top: 10px; 
  padding-top: 40px;
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
  width: 150px;
}

td:first-child button {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

th:nth-child(2), td:nth-child(2) {
  width: 150px;
}

th:nth-child(3), td:nth-child(3) {
  width: 100px;
  text-align: left;
}

th:nth-child(4), td:nth-child(4),
th:nth-child(6), td:nth-child(6) {
  width: 100px;
  text-align: right;
}



th:nth-child(5), td:nth-child(5) {
  width: 90px;
  text-align: center;
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
  background-color: #e90808;
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

.out-of-stock-row {
  background-color: #f9e0e0; /* Açık kırmızı ton */
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

</style>