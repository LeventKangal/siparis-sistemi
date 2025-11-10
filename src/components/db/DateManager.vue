<template>
  <div class="date-manager">
    <h2>Tarihler</h2>
    <table class="date-tablosu">
      <thead>
        <tr>
          <th>Dağıtım</th>
          <th>Tarih</th>
          <th>Aktif mi</th>
          <th>Liste Açık mı?</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
         <tr v-for="date in dateList":key="date.meet_id + '-' + date.week_id">
          <td>{{ date.meet_id}}</td>
          <td>{{ formatDateToText(date.week_id)}}</td>

          <!-- Aktif mi -->
          <td v-if="editingKey === date.meet_id + '-' + date.week_id">
            <input type="checkbox" v-model="editIsTest" />
          </td>
          <td v-else>{{ Boolean(date.isTest)? '✅': '❌'}}</td>

          <!-- Liste Açık mı -->
          <td v-if="editingKey === date.meet_id + '-' + date.week_id">
            <input type="checkbox" v-model="editIsOpen" />
          </td>
          <td v-else>{{ date.isOpen? '✅': '❌'}}</td>

          <!-- İşlem Butonları -->
          <td>
            <button v-if="editingKey === date.meet_id + '-' + date.week_id"
                    @click="updateDate(date.meet_id, date.week_id)">💾</button>
            <button v-if="editingKey === date.meet_id + '-' + date.week_id"
                    @click="cancelEdit">❌</button>
            <button v-else @click="startEdit(date)">📝</button>
            <button @click="deleteDate(date.meet_id, date.week_id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>Yeni Tarih</h3>
    <input v-model="newMeet" placeholder="Dağıtım" />
    <input type="date" v-model="newWeek" placeholder="Tarih" />

    <label style="display: inline-flex; align-items: center; gap: 4px;">
      <input type="checkbox" v-model="newIsTest" />
      Aktif mi?
    </label>

    <label style="display: inline-flex; align-items: center; gap: 4px;">
      <input type="checkbox" v-model="newIsOpen" />
      Liste Açık mı?
    </label>

    <button @click="addDate">➕ Ekle</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';
import { dateService} from '@/services/dateService';

const dateList = ref([]);

const newMeet = ref('');
const newWeek = ref('');
const newIsTest = ref(false);
const newIsOpen = ref(false);

const editingKey = ref(null);
const editIsTest = ref(false);
const editIsOpen = ref(false);

function formatDateToText(dateStr) {
  const aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const date = new Date(dateStr);
  const gun = date.getDate();
  const ay = aylar[date.getMonth()];
  const yil = date.getFullYear();

  return `${gun} ${ay} ${yil}`;
}



function startEdit(date) {
  console.log('Edit başlatılıyor:', date);
  editingKey.value = date.meet_id + '-' + date.week_id;
  editIsTest.value = date.isTest?? false;
  editIsOpen.value = date.isOpen?? false;
}

function cancelEdit() {
  editingKey.value = null;
  editIsTest.value = false;
  editIsOpen.value = false;
}

async function addDate() {
  const yeni = await dateService.insertOne({
    meet_id: newMeet.value,
    week_id: newWeek.value,
    isTest: newIsTest.value,
    isOpen: newIsOpen.value
});

  if (yeni) {
    dateList.value.push(yeni);
    newMeet.value = '';
    newWeek.value = '';
    newIsTest.value = false;
    newIsOpen.value = false;
}
}

async function updateDate(meet_id, week_id) {
  console.log('Güncelleme gönderiliyor:', {
    isTest: editIsTest.value,
    isOpen: editIsOpen.value
});

  const updated = await dateService.updateByCompositeKey(meet_id, week_id, {
    isTest: editIsTest.value,
    isOpen: editIsOpen.value
});

  if (updated) {
    const i = dateList.value.findIndex(
      d => d.meet_id === meet_id && d.week_id === week_id
);
    dateList.value[i] = updated;
    console.log('Güncelleme başarılı:', updated);
} else {
    console.warn('Güncelleme başarısız:', meet_id, week_id);
}

  cancelEdit(); // her durumda düzenleme modunu kapat
}

async function deleteDate(meet_id, week_id) {
  if (confirm('Bu tarih silinsin mi?')) {
    const ok = await dateService.deleteByCompositeKey(meet_id, week_id);
    if (ok) {
      dateList.value = dateList.value.filter(
        d =>!(d.meet_id === meet_id && d.week_id === week_id)
);
}
}
}

onMounted(async () => {
  dateList.value = await dateService.getAll();
});
</script>

<style scoped>
.date-tablosu th,
.date-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}

.date-manager {
  padding: 16px;
  max-width: 600px;
  margin: auto;
}
.date-manager input {
  margin: 4px;
  padding: 6px;
}
</style>