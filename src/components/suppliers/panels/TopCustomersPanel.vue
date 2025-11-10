<template>
  <div class="panel">
    <h2>👥 En Çok Sipariş Veren Türeticiler</h2>

    <div class="date-filter">
      <label>
        Başlangıç Tarihi:
        <input type="date" v-model="startDate" />
      </label>
      <label>
        Bitiş Tarihi:
        <input type="date" v-model="endDate" />
      </label>
      <button @click="fetchTopCustomers">🔍 Filtrele</button>
    </div>

    <table v-if="topCustomers.length">
  <thead>
    <tr>
      <th>Türetici Adı</th>
      <th>Ürünler</th>
      <th>Birim</th>
      <th>Harcama (₺)</th>
      <th>Genel Toplam (₺)</th>
      <th>Son Sipariş Tarihi</th>

    </tr>
  </thead>
  <tbody>
    <tr v-for="customer in topCustomers":key="customer.email">
      <td>{{ customer.name}}</td>
      <td>
        <ul>
          <li v-for="product in customer.products":key="product.product">
            {{ product.product}}
          </li>
        </ul>
      </td>
      <td style="text-align: center;">
        <ul>
          <li v-for="product in customer.products":key="product.product">
            {{ product.totalQuantity}}
          </li>
        </ul>
      </td>
      <td style="text-align: right;">
        <ul>
          <li v-for="product in customer.products":key="product.product">
            {{ formatPrice(product.totalSpent.toFixed(2))}}₺
          </li>
        </ul>
      </td>
      <td style="text-align: right;">{{ customer.totalSpentFormatted}}₺</td>
      <td>{{ customer.lastOrderDateFormatted}}</td>

    </tr>
  </tbody>
</table>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-if="error" class="error">❌ {{ error}}</div>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import { formatPrice} from '@/utils/formatters';

import supabase from '@/services/supabaseService';
const company = localStorage.getItem('companyName')?.trim() || '';
const userMail = localStorage.getItem('userEmail')?.trim() || '';

const supplierId = ref(null);
const topCustomers = ref([]);
const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
const error = ref('');

onMounted(async () => {
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

  if (!endDate.value) endDate.value = new Date().toISOString().split('T')[0];

  if (!company ||!userMail) {
    error.value = 'Şirket veya kullanıcı bilgisi eksik!';
    return;
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
});

async function fetchTopCustomers() {
  if (!startDate.value ||!endDate.value) {
    error.value = 'Lütfen tarih aralığını seçin.';
    return;
}
if (new Date(startDate.value) > new Date(endDate.value)) {
  error.value = 'Başlangıç tarihi, bitiş tarihinden büyük olamaz.';
  return;
}

  loading.value = true;
  error.value = '';
  topCustomers.value = [];

  const productRelation = `products_${company}`;

  const { data: userData, error: userError} = await supabase
.from(`users_${company}`)
.select('email, name');

  const userMap = {};
  userData?.forEach(u => {
    userMap[u.email] = u.name;
});

  const { data, error: fetchError} = await supabase
.from(`order_items_${company}`)
.select(`
      user_mail,
      quantity,
      price,
      created_at,
      product_id,
      ${productRelation} (
        name
)
    `)
.eq('supplier_id', supplierId.value)
.gte('created_at', startDate.value)
.lte('created_at', endDate.value);

  if (fetchError) {
    error.value = 'Veri alınamadı: ' + fetchError.message;
    loading.value = false;
    return;
}

  const customerStats = {};

data.forEach(item => {
  const email = item.user_mail;
  const name = userMap[email] || email;
  const productName = item[productRelation]?.name?? 'Bilinmeyen Ürün';
  const quantity = Number(item.quantity);
  const total = quantity * Number(item.price);
  const createdAt = new Date(item.created_at);

  if (!customerStats[email]) {
    customerStats[email] = {
      email,
      name,
      products: {},
      lastOrderDate: createdAt,
      totalSpent: 0
};
}

  if (createdAt> customerStats[email].lastOrderDate) {
    customerStats[email].lastOrderDate = createdAt;
}

  if (!customerStats[email].products[productName]) {
    customerStats[email].products[productName] = {
      product: productName,
      totalQuantity: 0,
      totalSpent: 0
};
}

  customerStats[email].products[productName].totalQuantity += quantity;
  customerStats[email].products[productName].totalSpent += total;
  customerStats[email].totalSpent += total;
});

topCustomers.value = Object.values(customerStats)
.map(customer => ({
...customer,
    products: Object.values(customer.products),
    lastOrderDateFormatted: customer.lastOrderDate.toLocaleDateString('tr-TR'),
    totalSpentFormatted: formatPrice(customer.totalSpent.toFixed(2))
}))
.sort((a, b) => b.totalSpent - a.totalSpent)
.slice(0, 10);

  loading.value = false;
}
</script>

<style scoped>
.panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.date-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.date-filter label {
  font-weight: bold;
}
.date-filter input,
.date-filter button {
  padding: 8px;
  font-size: 16px;
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
