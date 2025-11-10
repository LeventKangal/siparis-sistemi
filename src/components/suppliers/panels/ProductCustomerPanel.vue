<template>
  <div class="panel">
    <h2>🔍 Ürün Bazlı Türetici Listesi</h2>

    <div class="filters">
      <label>
        Ürün Seç:
        <select v-model="selectedProductId">
          <option disabled value="">-- Ürün Seçin --</option>
          <option v-for="product in productList":key="product.id":value="product.id">
            {{ product.name || '—' }}
          </option>
        </select>
      </label>
     <div class="date-filter">
      <label>
        Başlangıç Tarihi:
        <input type="date" v-model="startDate" />
      </label>
      <label>
        Bitiş Tarihi:
        <input type="date" v-model="endDate" />
      </label>

      <button @click="fetchProductCustomers">📄 Listele</button>
      </div>
    </div>

    <table v-if="customerList.length">
      <thead>
        <tr>
          <th style="text-align: left;">Türetici Adı</th>

          <th @click="sortBy('date')" style="cursor: pointer; text-align: left;">
  Sipariş Tarihi
  <span v-if="sortKey === 'date'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>

<th @click="sortBy('quantity')" style="cursor: pointer; text-align: center;">
  Adet
  <span v-if="sortKey === 'quantity'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>

<th @click="sortBy('total')" style="cursor: pointer; text-align: right;">
  Tutar (₺)
  <span v-if="sortKey === 'total'">{{ sortDirection === 'asc'? '▲': '▼'}}</span>
</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in sortedCustomerList":key="entry.id">
          <td>{{ entry.customerName}}</td>
          <td>{{ formatDate(entry.date)}}</td>
          <td style="text-align: center;">{{ entry.quantity}}</td>
          <td style="text-align: right;">{{ formatPrice(entry.total.toFixed(2))}} ₺ </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td><strong>Genel Toplam</strong></td>
          <td></td>
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
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice, formatDate} from '@/utils/formatters';

const company = localStorage.getItem('companyName')?.trim() || '';
const userMail = localStorage.getItem('userEmail')?.trim() || '';

const supplierId = ref(null);
const productList = ref([]);
const selectedProductId = ref('');
const startDate = ref('');
const endDate = ref('');
const customerList = ref([]);
const loading = ref(false);
const error = ref('');

//BAŞLIKTAN SIRALAMA  İŞLEMİ
const sortKey = ref('');         // Hangi alana göre sıralanacak
const sortDirection = ref('asc'); // Artan mı azalan mı

const sortedCustomerList = computed(() => {
  const stats = [...customerList.value];

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

onMounted(async () => {

  if (!company ||!userMail) {
    error.value = 'Şirket veya kullanıcı bilgisi eksik!';
    return;

}
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



  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${company}`)
.select('id')
.eq('email', userMail)
.single();

  if (supplierError ||!supplierData) {
    error.value = 'Üretici bilgisi alınamadı!';
    return;
}

  supplierId.value = supplierData.id;

  const { data: products, error: productError} = await supabase
.from(`products_${company}`)
.select('id, name')
.eq('supplier_id', supplierId.value);

  if (productError) {
    error.value = 'Ürün listesi alınamadı!';
    return;
}

  productList.value = products;
});

const totalRevenue = computed(() =>
  customerList.value.reduce((sum, item) => sum + item.total, 0)
);

async function fetchProductCustomers() {
  if (new Date(startDate.value) > new Date(endDate.value)) {
  error.value = 'Başlangıç tarihi, bitiş tarihinden büyük olamaz.';
  return;
}
  if (
!selectedProductId.value ||
!startDate.value ||
!endDate.value ||
!supplierId.value ||
    productList.value.length === 0
) {
    error.value = 'Veri yüklenmeden sorgu başlatıldı. Lütfen tekrar deneyin.';
    return;
}
  if (!selectedProductId.value ||!startDate.value ||!endDate.value) {
    error.value = 'Lütfen ürün ve tarih aralığını seçin.';
    return;
}

  loading.value = true;
  error.value = '';
  customerList.value = [];

  const { data: userData} = await supabase
.from(`users_${company}`)
.select('email, name');

  const userMap = {};
  userData?.forEach(u => {
    userMap[u.email] = u.name;
});

  const { data, error: fetchError} = await supabase
.from(`order_items_${company}`)
.select('user_mail, quantity, price, created_at')
.eq('supplier_id', supplierId.value)
.eq('product_id', selectedProductId.value)
.gte('created_at', startDate.value)
.lte('created_at', endDate.value);

  if (fetchError) {
    error.value = 'Veri alınamadı: ' + fetchError.message;
    loading.value = false;
    return;
}

  customerList.value = data.map(item => ({
 id: item.id,
    customerName: userMap[item.user_mail] || item.user_mail,
    date: item.created_at.split('T')[0],
    quantity: Number(item.quantity),
    total: Number(item.quantity) * Number(item.price)
}));



  loading.value = false;
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
}
.date-filter label {
    margin-right: 12px;
}
.panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.filters {
  margin-bottom: 12px;
}
label {
  margin-right: 12px;
}
select, input[type="date"] {
  padding: 4px;
  margin-left: 4px;
}
button {
  padding: 6px 12px;
  background-color: #2ecc71;
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
.loading {
  margin-top: 12px;
  color: #888;
}
.error {
  margin-top: 12px;
  color: red;
}
</style>
