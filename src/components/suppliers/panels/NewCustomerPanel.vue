<template>
  <div class="panel">
    <h2>🆕 Yeni Türetici Kazanımı (Son 30 Gün)</h2>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-if="error" class="error">❌ {{ error}}</div>

    <p v-if="newCustomers.length">Toplam Yeni Türetici: <strong>{{ newCustomers.length}}</strong></p>

    <table v-if="newCustomers.length">
      <thead>
        <tr>
          <th style="text-align: left;">Türetici Adı</th>
          <th style="text-align: right;">İlk Sipariş Tarihi</th>
          <th style="text-align: left;">İlk Ürün</th>
          <th style="text-align: right;">İlk Sipariş Tutarı (₺)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in newCustomers":key="customer.email">
          <td>{{ customer.name}}</td>
          <td style="text-align: right;">{{formatDate(customer.firstOrderDate)}}</td>
          <td>{{ customer.firstProduct}}</td>
          <td style="text-align: right;">{{formatPrice(customer.firstOrderTotal)}} ₺</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice, formatDate} from '@/utils/formatters';

const company = localStorage.getItem('companyName')?.trim() || '';
const userMail = localStorage.getItem('userEmail')?.trim() || '';

const supplierId = ref(null);
const newCustomers = ref([]);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
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
  await fetchNewCustomers();
});

async function fetchNewCustomers() {
  loading.value = true;
  error.value = '';
  newCustomers.value = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoDate = thirtyDaysAgo.toISOString();

  // 🧠 Kullanıcı adlarını çek
  const { data: userData, error: userError} = await supabase
.from(`users_${company}`)
.select('email, name');

  const userMap = {};
  userData?.forEach(u => {
    userMap[u.email] = u.name;
});

  // 📦 Sipariş verilerini çek
  const { data, error: fetchError} = await supabase
.from(`order_items_${company}`)
.select('user_mail, quantity, price, created_at, name')
.eq('supplier_id', supplierId.value)
.gte('created_at', isoDate);

  if (fetchError) {
    error.value = 'Veri alınamadı: ' + fetchError.message;
    loading.value = false;
    return;
}

  const customerMap = {};

  data.forEach(item => {
    const email = item.user_mail;
    const name = userMap[email] || email;
    const orderDate = item.created_at;
    const orderDateStr = orderDate.split('T')[0];
    const orderTotal = Number(item.quantity) * Number(item.price);
    const productName = item.name;

    if (!customerMap[email]) {
      customerMap[email] = {
        email,
        name,
        firstOrderDate: orderDateStr,
        firstOrderTimestamp: orderDate,
        firstOrderTotal: orderTotal,
        firstProduct: productName
};
} else if (orderDate < customerMap[email].firstOrderTimestamp) {
      customerMap[email].firstOrderDate = orderDateStr;
      customerMap[email].firstOrderTimestamp = orderDate;
      customerMap[email].firstOrderTotal = orderTotal;
      customerMap[email].firstProduct = productName;
}
});

  newCustomers.value = Object.values(customerMap).sort(
    (a, b) => new Date(a.firstOrderTimestamp) - new Date(b.firstOrderTimestamp)
);

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
