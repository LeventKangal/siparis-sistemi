<template>
  <div class="reset-schedule-view">
    <h2>Stok Sıfırlama Zamanlamaları</h2>

  <button @click="openModal()">➕ Yeni Zamanlama</button>
   
    <table>
      <thead>
        <tr>
          <th>Firma</th>
          <th>Üretici</th>
          <th>Gün</th>
          <th>Saat</th>
          <th>Son Sıfırlama</th>
          <th>Sayım</th>
          <th>Durum</th>
          <th>İşlem</th>
          <th>Sil</th>
          <th>Düzenle</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in schedules":key="item.id">
          <td>{{ item.company_name}}</td>
          <td>{{ item.supplier_id}}</td>
          <td>{{ item.reset_day}}</td>
          <td>{{ item.reset_time}}</td>
          <td>{{ formatDate(item.last_reset_at)}}</td>
          <td>{{ item.reset_count}}</td>
          <td>
            <span :class="item.active? 'active': 'inactive'">
              {{ item.active? 'Aktif': 'Pasif'}}
            </span>
          </td>
          <td>
            <button @click="triggerReset(item)">Şimdi Sıfırla</button>
          </td>
          <td>
             <button @click="deleteSchedule(item.id)">🗑 Sil</button>
          </td>
          <td>
             <button @click="openModal(item)">✏️ Düzenle</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Modal -->
<div v-if="showModal" class="modal-overlay">
  <div class="modal-content">
    <h3>{{ editMode? 'Zamanlamayı Düzenle': 'Yeni Zamanlama Ekle'}}</h3>

    <form @submit.prevent="saveSchedule">
      <p><strong>Firma:</strong> {{ companyName}}</p>
      <label>Üretici ID:</label>
      <input v-model="form.supplier_id" required />

      <label>Gün:</label>
      <select v-model="form.reset_day">
        <option v-for="day in days":key="day":value="day">{{ day}}</option>
      </select>

      <label>Saat:</label>
      <input v-model="form.reset_time" type="time" required />

      <label>Aktif mi?</label>
      <input type="checkbox" v-model="form.active" />

      <button type="submit">Kaydet</button>
      <button type="button" @click="closeModal()">İptal</button>
    </form>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';

const companyName = localStorage.getItem('companyName') || '';

const schedules = ref([]);
const showModal = ref(false);
const editMode = ref(false);
const form = ref({
  company_name: '',
  supplier_id: '',
  reset_day: 'Monday',
  reset_time: '08:00',
  active: true
});

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function openModal(item = null) {
  showModal.value = true;
  editMode.value =!!item;
  if (item) {
    form.value = {...item};
} else {
    form.value = {
      company_name: '',
      supplier_id: '',
      reset_day: 'Monday',
      reset_time: '08:00',
      active: true
};
}
}

function closeModal() {
  showModal.value = false;
}

async function saveSchedule() {
  if (editMode.value) {
  await supabase
.from('reset_schedule')
.update(form.value)
.eq('id', form.value.id);

  // Log ekle
  await supabase
.from('reset_logs')
.insert({
      schedule_id: form.value.id,
      company_name: companyName,
      status: 'updated',
      message: 'Zamanlama güncellendi'
});
}


  closeModal();
  location.reload(); // veya veri yeniden çekilebilir
}

async function deleteSchedule(id) {
  const confirmDelete = confirm('Bu zamanlamayı silmek istediğinize emin misiniz?');
  if (!confirmDelete) return;

  const { error} = await supabase
.from('reset_schedule')
.delete()
.eq('id', id);

  if (!error) {
    // 1. Arayüzden kaldır
    schedules.value = schedules.value.filter(item => item.id!== id);

    // 2. Log kaydı ekle
    await supabase
.from('reset_logs')
.insert({
        schedule_id: id,
        company_name: companyName,
        status: 'deleted',
        message: 'Zamanlama silindi'
});

    // 3. Bildirim
    alert('✅ Zamanlama silindi');
} else {
    alert(`❌ Silme hatası: ${error.message}`);
}
}


onMounted(async () => {
  
  const { data, error} = await supabase
.from('reset_schedule')
.select('*')
.eq('company_name', companyName)
.order('reset_time', { ascending: true});

  if (!error) schedules.value = data;
});

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString();
}

async function triggerReset(item) {
  const { error} = await supabase
.from(`products_${item.company_name}`)
.update({ stock: 0})
.eq('supplier_id', item.supplier_id);

  const status = error? 'error': 'success';
  const message = error? error.message: 'Stok başarıyla sıfırlandı';

  await supabase
.from('reset_logs')
.insert({
      schedule_id: item.id,
      company_name: item.company_name,
      supplier_id: item.supplier_id,
      status,
      message
});

  if (!error) {
    item.last_reset_at = new Date().toISOString();
    item.reset_count = (item.reset_count || 0) + 1;

    await supabase
.from('reset_schedule')
.update({
        last_reset_at: item.last_reset_at,
        reset_count: item.reset_count,
        triggered_by: 'manual'
})
.eq('id', item.id);

    alert(`${item.company_name} için stok sıfırlandı`);
} else {
    alert(`Hata oluştu: ${error.message}`);
}
}
</script>

<style scoped>
.reset-schedule-view {
  margin-top: 40px; /* veya 60px, ihtiyaca göre artırabilirsin */
}

.active { color: green; font-weight: bold;}
.inactive { color: red; font-weight: bold;}
table { width: 100%; border-collapse: collapse; margin-top: 1rem;}
th, td { padding: 8px; border: 1px solid #ccc; text-align: center;}
button { padding: 4px 8px; cursor: pointer;}

.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}
form label {
  display: block;
  margin-top: 10px;
}
form input, form select {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
}
form button {
  margin-top: 15px;
  margin-right: 10px;
}

button {
  padding: 4px 8px;
  cursor: pointer;
}

button:hover {
  background-color: #eee;
}
</style>