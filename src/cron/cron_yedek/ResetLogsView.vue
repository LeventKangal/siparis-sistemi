<template>
  <div class="reset-logs-view">
    <h2>İşlem Geçmişi</h2>

    <div v-if="isLoading" class="loading">⏳ Yükleniyor...</div>

    <table v-else>
      <thead>
        <tr>
          <th>Firma</th>
          <th>Üretici</th>
          <th>Durum</th>
          <th>Mesaj</th>
          <th>Tarih</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in filteredLogs" :key="log.id">
          <td>{{ log.company_name}}</td>
          <td>{{ getSupplierLabel(log.supplier_id)}}</td>
          <td>
            <span :class="log.status === 'success'? 'success': 'error'">
              {{ log.status === 'success'? 'Başarılı': 'Hata'}}
            </span>
          </td>
          <td>{{ log.message}}</td>
          <td>{{ formatDate(log.timestamp)}}</td>
          <td>
            <button
               @click="restoreStock(log.company_name, log.supplier_id)"
              :disabled="log.status!== 'success' ||!log.supplier_id"> Geri Al
            </button>
          </td> 
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';

const companyName = localStorage.getItem('companyName') || '';

const logs = ref([]);
const isLoading = ref(true);

const suppliers = ref([]);

const filteredLogs = computed(() =>
  logs.value.filter(log => log.action_type === 'reset' && log.status === 'success')
);

const restoreStock = async (companyName, supplierId) => {
  const { data: backups, error} = await supabase
.from('stock_backups')
.select('product_id, original_stock')
.eq('company_name', companyName)
.eq('supplier_id', supplierId);

  if (error ||!backups || backups.length === 0) {
    alert('⚠️ Geri yüklenecek yedek bulunamadı.');
    return;
}

  for (const item of backups) {
    const { error: updateError} = await supabase
.from(`products_${companyName}`)
.update({ stock: item.original_stock})
.eq('id', item.product_id);

    if (updateError) {
      console.error(`🛑 Ürün ${item.product_id} güncellenemedi:`, updateError.message);
}
}

  alert(`🔁 ${companyName} → supplier_id=${supplierId} stokları başarıyla geri yüklendi.`);
};

onMounted(async () => {
  
  console.log('Aktif firma:', companyName);

  const { data: logsData, error: logsError} = await supabase
.from('reset_logs')
.select('id, company_name, supplier_id, status, message, action_type, timestamp')
.eq('company_name', companyName);


  if (!logsError) logs.value = logsData;

  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${companyName}`)
.select('id, name');

  if (!supplierError) suppliers.value = supplierData;

  isLoading.value = false;
});

function getSupplierLabel(id) {
  const supplier = suppliers.value.find(s => String(s.id) === String(id));
  return  supplier? `${supplier.id} - ${supplier.name}`: id;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString();
}
</script>

<style scoped>
.reset-logs-view {
  margin-top: 40px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  padding: 8px;
  border: 1px solid #ccc;
  text-align: center;
}
.success {
  color: green;
  font-weight: bold;
}
.error {
  color: red;
  font-weight: bold;
}
button {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
}
button:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  font-weight: bold;
  margin-top: 1rem;
}

</style>