<template>
  <div class="restore-stock-view">
    <h2>Stok Geri Yükleme</h2>
    <button @click="openRestoreModal">Yedeklenmiş Stokları Gör</button>
    <p v-if="message">{{ message}}</p>
  </div>
  
<div v-if="showModal" class="modal">
  <h3>Yedeklenmiş Ürünler</h3>
  <table>
  <thead>
    <tr>
      <th>Ürün ID</th>
      <th>Stok</th>
      <th>Supplier ID</th>
      <th>Supplier Adı</th>
      <th>Seç</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in backupItems" :key="item.product_id">
      <td>{{ item.product_id}}</td>
      <td>{{ item.original_stock}}</td>
      <td>{{ item.supplier_id}}</td>
      <td>{{ getSupplierName(item.supplier_id)}}</td>
      <td><input type="checkbox" v-model="selectedIds" :value="item.product_id" /></td>
    </tr>
  </tbody>
</table>
  <button @click="restoreSelected">Seçilenleri Geri Yükle</button>
  <button @click="showModal = false">Kapat</button>
</div>
</template>

<script setup lang="ts">

import { ref, onMounted} from 'vue'; 
import supabase from '@/services/supabaseService';

const companyName = localStorage.getItem('companyName') || '';
const message = ref('');

const showModal = ref(false);
const backupItems = ref([]);
const selectedIds = ref<number[]>([]);
const suppliers = ref([]);

const openRestoreModal = async () => {
  showModal.value = true;
  selectedIds.value = [];

  const { data, error} = await supabase
.from('stock_backups')
.select('product_id, original_stock, supplier_id')
.eq('company_name', companyName);

  if (!error) backupItems.value = data;
  else message.value = '🛑 Yedekler alınamadı: ' + error.message;
};

const restoreSelected = async () => {
  let successCount = 0;

  for (const id of selectedIds.value) {
    const item = backupItems.value.find(p => p.product_id === id);
    if (!item) continue;

    const { error: updateError} = await supabase
.from(`products_${companyName}`)
.update({ stock: item.original_stock})
.eq('id', item.product_id);

    if (!updateError) successCount++;
    else console.error(`🛑 Ürün ${item.product_id} güncellenemedi:`, updateError.message);
}

  await supabase.from('reset_logs').insert({
    company_name: companyName,
    status: 'restored',
    message: `${successCount} ürün geri yüklendi`,
    timestamp: new Date().toISOString()
});

  message.value = `🔁 ${successCount} ürün başarıyla geri yüklendi.`;
  showModal.value = false;
};

const restoreStock = async () => {
  // 1. Yedekleri çek
  const { data: backups, error} = await supabase
.from('stock_backups')
.select('product_id, original_stock')
.eq('company_name', companyName);

  if (error) {
    message.value = '🛑 Geri yükleme başarısız: ' + error.message;
    return;
}

  if (!backups || backups.length === 0) {
    message.value = '⚠️ Geri yüklenecek yedek bulunamadı.';
    return;
}

  // 2. Stokları geri yükle
  let successCount = 0;
  for (const item of backups) {
    const { error: updateError} = await supabase
.from(`products_${companyName}`)
.update({ stock: item.original_stock})
.eq('id', item.product_id);

    if (!updateError) {
      successCount++;
} else {
      console.error(`🛑 Ürün ${item.product_id} güncellenemedi:`, updateError.message);
}
}

  // 3. Log kaydı (opsiyonel)
  await supabase.from('reset_logs').insert({
    company_name: companyName,
    status: 'restored',
    message: `${successCount} ürün geri yüklendi`,
    created_at: new Date().toISOString()
});

  // 4. Kullanıcıya mesaj
  message.value = `🔁 ${successCount} ürün başarıyla geri yüklendi.`;
};

function getSupplierName(id: string | number) {
  const supplier = suppliers.value.find(s => String(s.id) === String(id));
  return supplier? supplier.name: '—';
}

onMounted(async () => {
  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, name');

  if (!error) suppliers.value = data;
});


</script>

<style scoped>
.restore-stock-view {
  padding: 2rem;
}
button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
p {
  margin-top: 1rem;
  font-weight: bold;
}

.modal {
  background: #f9f9f9;
  padding: 1rem;
  border: 1px solid #ccc;
  margin-top: 1rem;
}
table {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
}
th, td {
  padding: 8px;
  border: 1px solid #ddd;
}

</style>