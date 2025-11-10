<template>
  <div class="panel">
    <h2>📦 Ürün Satış Performansı</h2>
 <div class="date-filter">
    <label>
      Başlangıç Tarihi:
      <input type="date" v-model="startDate" />
    </label>
    <label>
      Bitiş Tarihi:
      <input type="date" v-model="endDate" />
    </label>
    <button @click="fetchSalesStats">🔍 Filtrele</button>
  </div>
    <table v-if="productStats.length">
      <thead>
        <tr>
    <th @click="sortBy('name')" style="cursor: pointer; text-align: left;">
  Ürün Adı
  <span v-if="sortKey === 'name'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>

<th @click="sortBy('totalQuantity')" style="cursor: pointer; text-align: center;">
  Toplam Adet
  <span v-if="sortKey === 'totalQuantity'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>

<th @click="sortBy('totalRevenue')" style="cursor: pointer; text-align: right;">
  Toplam Gelir (₺)
  <span v-if="sortKey === 'totalRevenue'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>
       </tr>
      </thead>
      <tbody>
        <template v-for="stat in sortedProductStats" :key="stat.id">
          <tr :class="{ 'active-row': expandedProductId === stat.id }" @click="toggleProductDetail(stat.id)">
     <!--     <tr @click="toggleProductDetail(stat.id)">  -->
            <td>{{ stat.name || '—' }}</td>
            <td style="text-align: center;">{{ stat.totalQuantity.toFixed(2)}}</td>
            <td style="text-align: right;">{{formatPrice(stat.totalRevenue.toFixed(2))}} ₺</td>
          </tr>
          <tr v-if="expandedProductId === stat.id">
            <td colspan="3">
              <div class="detail-panel">
                <h4>📄 Türetici Listesi: {{ stat.name}}</h4>

          <table class="customer-table" v-if="productCustomerMap[stat.id]?.length">
               <thead>
               <tr>
                <th>Türetici Adı</th>
                <th>Sipariş Tarihi</th>
                <th style="text-align: center;">Adet</th>
                <th style="text-align: right;">Tutar (₺)</th>
               </tr>
              </thead>
             <tbody>
               <tr v-for="entry in productCustomerMap[stat.id]":key="entry.id">
                <td>{{ entry.customerName}}</td>
                <td>{{ entry.date}}</td>
                <td style="text-align: center;">{{entry.quantity.toFixed(2)}}</td>
                <td style="text-align: right;">{{formatPrice(entry.total.toFixed(2))}}₺</td>
              </tr>
            </tbody>
          </table>

       <div v-else>Bu ürün için veri bulunamadı.</div>
      </div>
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot>
        <tr>
          <td><strong>Genel Toplam</strong></td>
          <td></td>
          <td style="text-align: right;"><strong>{{formatPrice(totalRevenue.toFixed(2))}} ₺</strong></td>
        </tr>
      </tfoot>
    </table>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-if="error" class="error">❌ {{ error}}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice, formatDate} from '@/utils/formatters';

const company = localStorage.getItem('companyName')?.trim() || '';
const userMail = localStorage.getItem('userEmail')?.trim() || '';

const supplierId = ref(null);
const productStats = ref([]);
const productCustomerMap = ref({});
const expandedProductId = ref(null);
const startDate = ref('');
const endDate = ref('');

const loading = ref(false);
const error = ref('');

//BAŞLIKTAN SIRALAMA  İŞLEMİ
const sortKey = ref('');         // Hangi alana göre sıralanacak
const sortDirection = ref('asc'); // Artan mı azalan mı

const sortedProductStats = computed(() => {
  const stats = [...productStats.value]; // Orijinal diziyi bozmamak için kopya

  if (!sortKey.value) return stats;

  return stats.sort((a, b) => {
    const valA = a[sortKey.value];
    const valB = b[sortKey.value];

    if (typeof valA === 'string') {
      return sortDirection.value === 'asc'
? valA.localeCompare(valB)
: valB.localeCompare(valA);
}

    return sortDirection.value === 'asc'
? valA - valB
: valB - valA;
});
});

function sortBy(key) {
  if (sortKey.value === key) {
    // Aynı sütuna tekrar tıklanırsa yönü değiştir
    sortDirection.value = sortDirection.value === 'asc'? 'desc': 'asc';
} else {
    sortKey.value = key;
    sortDirection.value = 'asc';
}
}

onMounted(() => {
  // Eğer tarih alanları boşsa, varsayılanları ata
  if (!startDate.value) {
  if (company === 'geto') {
    startDate.value = '2025-08-25';
} else if (company === 'ggt') {
    startDate.value = '2025-08-19';
} else if (company === 'bitot') {
    startDate.value = '2025-10-01';
} else if (company === 'sgt') {
    startDate.value = '2025-11-05';
}
}

  if (!endDate.value) {
    const today = new Date().toISOString().split('T')[0];
    endDate.value = today;
}
});

const totalRevenue = computed(() =>
  productStats.value.reduce((sum, item) => sum + item.totalRevenue, 0)
);

async function fetchSalesStats() {
  if (!startDate.value || !endDate.value) {
    error.value = 'Lütfen tarih aralığını seçin.';
    return;
  }

  // 🚫 Tarih mantığı kontrolü
  if (new Date(startDate.value) > new Date(endDate.value)) {
    error.value = 'Başlangıç tarihi, bitiş tarihinden büyük olamaz.';
    return
   }
  loading.value = true;
  error.value = '';
  productStats.value = [];

  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${company}`)
.select('id')
.eq('email', userMail)
.single();

  if (supplierError ||!supplierData) {
    error.value = 'Üretici bilgisi alınamadı!';
    loading.value = false;
    return;
}

  supplierId.value = supplierData.id;

  const { data, error: fetchError} = await supabase
.from(`order_items_${company}`)
.select('product_id, name, quantity, price')
.eq('supplier_id', supplierId.value)
.gte('created_at', startDate.value)
.lte('created_at', endDate.value);

  if (fetchError) {
    error.value = 'Veri alınamadı: ' + fetchError.message;
    loading.value = false;
    return;
}

  const statsMap = {};
  data.forEach(item => {
    const id = item.product_id;
    if (!statsMap[id]) {
      statsMap[id] = {
        id,
        name: item.name,
        totalQuantity: 0,
        totalRevenue: 0
};
}
    statsMap[id].totalQuantity += Number(item.quantity);
    statsMap[id].totalRevenue += Number(item.quantity) * Number(item.price);
});

  productStats.value = Object.values(statsMap);
  loading.value = false;
}

async function toggleProductDetail(productId) {
  if (expandedProductId.value === productId) {
    expandedProductId.value = null;
    return;
}

  expandedProductId.value = productId;

  if (productCustomerMap.value[productId]) return;

  const { data: userData} = await supabase
.from(`users_${company}`)
.select('email, name');

  const userMap = {};
  userData?.forEach(u => {
    userMap[u.email] = u.name;
});

  const { data, error} = await supabase
.from(`order_items_${company}`)
.select('user_mail, quantity, price, created_at')
.eq('supplier_id', supplierId.value)
.eq('product_id', productId)
.gte('created_at', startDate.value)
.lte('created_at', endDate.value);

  if (error) {
    console.error('Detay verisi alınamadı:', error.message);
    productCustomerMap.value[productId] = [];
    return;
}

  productCustomerMap.value[productId] = data.map(item => ({
    id: item.id,
    customerName: userMap[item.user_mail] || item.user_mail,
    date: formatDate(item.created_at.split('T')[0]),
    quantity: Number(item.quantity),
    total: Number(item.quantity) * Number(item.price)
}));
}
</script>

<style scoped>
.date-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
}

.date-filter label {
  display: flex;
  flex-direction: column;
  font-weight: bold;
}

.date-filter input[type="date"],
.date-filter button {
  padding: 8px;
  font-size: 16px;
  margin-top: 4px;
}

@media (min-width: 600px) {
.date-filter {
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
}

.date-filter label {
    margin-right: 12px;
}
}
.panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}
label {
  margin-right: 12px;
}
input[type="date"] {
  padding: 4px;
  margin-left: 4px;
}
button {
  padding: 6px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  padding: 8px;
  border: 1px solid #ccc;
}
.detail-panel {
  background-color: #f0f8ff;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.detail-panel ul {
  list-style: none;
  padding-left: 0;
}
.detail-panel li {
  margin-bottom: 6px;
}
.loading {
  margin-top: 12px;
  color: #888;
}
.error {
  margin-top: 12px;
  color: red;
}

.detail-panel {
  background-color: #f0f8ff;
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-top: 8px;
}

.customer-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.customer-table th,
.customer-table td {
  padding: 8px;
  border: 1px solid #ccc;
}

.customer-table th {
  background-color: #e6f2ff;
  text-align: left;
}
tr.active-row {
  background-color: #eef6ff;
}

</style>
