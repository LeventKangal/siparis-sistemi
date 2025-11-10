<template>
  <div class="panel">
    <h2>📅 Tarih Bazlı Satışlar</h2>

    <label>
      Başlangıç Tarihi:
      <input type="date" v-model="startDate" />
    </label>
    <label>
      Bitiş Tarihi:
      <input type="date" v-model="endDate" />
    </label>
    <button @click="fetchSales">🔍 Filtrele</button>

    <table v-if="salesByDate.length">
      <thead>
        <tr>
          <th style="text-align: center;">Tarih</th>
          <th style="text-align: center;">Toplam Adet</th>
          <th style="text-align: right;">Toplam Gelir (₺)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in salesByDate":key="stat.date">
          <td style="text-align: center;">{{formatDate(stat.date)}}</td>
          <td style="text-align: center;">{{ stat.totalQuantity}}</td>
          <td style="text-align: right;">{{formatPrice(stat.totalRevenue.toFixed(2))}} ₺</td>
        </tr>
      </tbody>
    </table>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-if="error" class="error">❌ {{ error}}</div>
  </div>
</template>

<script setup>
import { ref} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice, formatDate} from '@/utils/formatters';

const company = localStorage.getItem('companyName')?.trim() || '';
const userMail = localStorage.getItem('userEmail')?.trim() || '';
const supplierId = ref(null);

const startDate = ref('');
const endDate = ref('');
const salesByDate = ref([]);
const loading = ref(false);
const error = ref('');

async function fetchSupplierId() {
  const { data, error} = await supabase
.from(`suppliers_${company}`)
.select('id')
.eq('email', userMail)
.single();

  if (!error && data) {
    supplierId.value = data.id;
} else {
    error.value = 'Üretici bilgisi alınamadı!';
}
}

async function fetchSales() {
  if (!startDate.value ||!endDate.value) {
    error.value = 'Lütfen tarih aralığını seçin.';
    return;
}

  if (!supplierId.value) {
    await fetchSupplierId();
    if (!supplierId.value) return;
}

  loading.value = true;
  error.value = '';

  const { data, error: fetchError} = await supabase
.from(`order_items_${company}`)
.select('created_at, quantity, price')
.eq('supplier_id', supplierId.value)
.gte('created_at', startDate.value)
.lte('created_at', endDate.value);

  if (fetchError) {
    error.value = 'Veri alınamadı: ' + fetchError.message;
    loading.value = false;
    return;
}

  const dailyStats = {};
  data.forEach(item => {
    const day = item.created_at.split('T')[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { totalQuantity: 0, totalRevenue: 0};
}
    dailyStats[day].totalQuantity += Number(item.quantity);
    dailyStats[day].totalRevenue += Number(item.quantity) * Number(item.price);
});

  salesByDate.value = Object.entries(dailyStats).map(([date, stat]) => ({
    date,
...stat
}))
.sort((a, b) => new Date(a.date) - new Date(b.date));

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
label {
  margin-right: 12px;
}
input[type="date"] {
  padding: 4px;
  margin-left: 4px;
}
button {
  margin-left: 8px;
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
  text-align: left;
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