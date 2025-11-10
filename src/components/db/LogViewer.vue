<template>
  <div>
    <h2 style="margin-top: 40px;">📘 Sipariş Logları</h2>
        
    <div class="filters">
  <input type="date" v-model="selectedDate" class="filter-input" />
  <input type="text" v-model="selectedMeetId" placeholder="Toplantı ID" class="filter-input" />
  <input type="text" v-model="selectedUserName" placeholder="Kullanıcı adı" class="filter-input" />
  <input type="text" v-model="selectedProductName" placeholder="Ürün adı" class="filter-input" />
  <button @click="resetFilters">🧹 Temizle</button>
    </div>
    <label style="display: grid; grid-template-columns: auto 1fr; align-items: center; font-size: 0.9rem;">
  <input type="checkbox" v-model="showDeletedOnly" @change="fetchLogs" />
  <span>Sadece silinmişleri göster</span>
    </label>
     <label style="display: grid; grid-template-columns: auto 1fr; align-items: center; font-size: 0.9rem;">
  <input type="checkbox" v-model="showErrorOnly" @change="fetchLogs" />
  <span>Sadece Hata olanları göster</span>
    </label>

  <div class="log-table-wrapper"></div>  
    <table>
  <thead>
    <tr>
      <th style="text-align: left;">Tarih</th>
      <th>Toplantı</th>
      <th style="text-align: left;" >Kullanıcı</th>
      <th>Üretici</th>
      <th style="width: 250px; text-align: left;">Ürün</th>
      <th>İşlem</th>
      <th>Yeni</th>
      <th>Eski</th>
      <th>Mesaj</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="log in logs" :key="log.id" :class="{ deleted: log.action === 'delete'}">
  <td>{{ new Date(log.timestamp).toLocaleString()}}</td>
  <td style="text-align: center;">{{ log.meet_id}}</td>
  <td>{{ log.details?.user_name?? log.details?.name?? '—'}}</td>
  <td>{{ log.supplier_id}}</td>
  <td>
  <!--  <span v-if="log.action === 'delete'">🗑️</span>-->
  {{ log.details?.product_id?? log.product_id}}
  </td>


  <td style="width: 50px; text-align: center;">{{ log.action}}</td>
  <td style="width: 50px; text-align: center;">{{ log.details?.quantity}}</td>
  <td style="width: 50px; text-align: center;">{{ log.details?.oldquantity}}</td>
  <td style="width: 300px; text-align: left;">{{ log.details?.error}}</td>
</tr>

  </tbody>
</table>
</div>

</template>

<script setup>

import { ref, onMounted, watch} from 'vue';
import supabase from '@/services/supabaseService';

const selectedUserName = ref('');
const selectedProductName = ref('');
const logs = ref([]);
const selectedMeetId = ref('');
const selectedDate = ref('');
const companyName = localStorage.getItem('companyName') || '';
const showDeletedOnly = ref(false);
const showErrorOnly = ref(false);

function resetFilters() {
  selectedDate.value = '';
  selectedMeetId.value = '';
  selectedUserName.value = '';
  selectedProductName.value = '';
  showDeletedOnly.value = false;
  fetchLogs();
}

watch([selectedDate, selectedMeetId, selectedUserName, selectedProductName], fetchLogs);

async function fetchLogs() {
 
  let query = supabase
.from('order_logs')
.select('*')
.eq('company_name', companyName);

  if (selectedMeetId.value) {
    query = query.eq('meet_id', selectedMeetId.value);
}

  if (selectedUserName.value) {
    query = query.ilike('details->>user_name', `%${selectedUserName.value}%`);
}

  if (selectedProductName.value) {
    query = query.ilike('details->>product_name', `%${selectedProductName.value}%`);
}

  if (selectedDate.value) {
    const start = new Date(selectedDate.value);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    query = query.gte('timestamp', start.toISOString()).lt('timestamp', end.toISOString());
}

const filters = [];
if (showDeletedOnly.value) filters.push('action.eq.delete');
if (showErrorOnly.value) filters.push('action.eq.error');

if (filters.length> 0) {
  query = query.or(filters.join(','));
}

  const { data, error} = await query.order('timestamp', { ascending: false});

  if (!error) logs.value = data;
  else console.error('❌ Log çekme hatası:', error);
}

onMounted(() => {
  fetchLogs();
});

</script>

<style scoped>

h2 {
  margin-top: 40px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-input {
  padding: 4px 8px;
  font-size: 0.9rem;
  width: 150px;
}


.deleted {
  background-color: #ffe6e6;
  color: #a00;
  font-weight: bold;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px; /* kutu ile yazı arasındaki mesafe */
  font-size: 0.9rem;
  margin-bottom: 10px;
}
.checkbox-label input[type="checkbox"] {
  transform: scale(0.9);
}
.log-table-wrapper {
  margin-top: 12px;     /* tabloyu biraz aşağıya alır */
  margin-left: 20px;    /* tabloyu hafif sola kaydırır */
}


</style>