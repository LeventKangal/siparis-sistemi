<template>
  <div class="rate-manager">
    <h2>Oran Listesi</h2>
    <table class="rate-tablosu">
      <thead>
        <tr>
          <th>#</th><th>Min</th><th>Oran (%)</th><th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rate in rateList":key="rate.id">
          <td>{{ rate.id}}</td>
          <td v-if="editingId === rate.id">
            <input v-model.number="editMin" type="number" />
          </td>
          <td v-else>{{ rate.min_value}}</td>

          <td v-if="editingId === rate.id">
            <input v-model.number="editRate" type="number" />
          </td>
          <td v-else>{{ rate.rate}}</td>

          <td>
            <button v-if="editingId === rate.id" @click="updateRate(rate.id)">💾</button>
            <button v-if="editingId === rate.id" @click="cancelEdit">❌</button>
            <button v-else @click="startEdit(rate)">📝</button>
            <button @click="deleteRate(rate.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
   <div class="add-rate-form"> 
    <h3>Yeni Oran</h3>
    <input v-model.number="newMin" type="number" placeholder="Minimum" />
    <input v-model.number="newRate" type="number" placeholder="Oran" />
    <button @click="addRate">➕ Ekle</button>
   </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue';
import { rateService} from '@/services/rateService';
import type { Rate} from '@/services/rateService';


const rateList = ref<Rate[]>([]);
const newMin = ref(0);
const newRate = ref(0);

const editingId = ref<number | null>(null);
const editMin = ref(0);
const editRate = ref(0);

function startEdit(rate: Rate) {
  editingId.value = rate.id;
  editMin.value = rate.min_value;
  editRate.value = rate.rate;
}

function cancelEdit() {
  editingId.value = null;
}

async function addRate() {
  const yeni = await rateService.insertOne({ min_value: newMin.value, rate: newRate.value});
  if (yeni) {
    rateList.value.push(yeni);
    newMin.value = 0;
    newRate.value = 0;
}
}

async function updateRate(id: number) {
  const updated = await rateService.updateById(id, { min_value: editMin.value, rate: editRate.value});
  if (updated) {
    const i = rateList.value.findIndex(r => r.id === id);
    rateList.value[i] = updated;
    cancelEdit();
}
}

async function deleteRate(id: number) {
  if (confirm('Bu oran silinsin mi?')) {
    const ok = await rateService.deleteById(id);
    if (ok) rateList.value = rateList.value.filter(r => r.id!== id);
}
}

onMounted(async () => {
  rateList.value = await rateService.getAll();
});
</script>

<style scoped>
.rate-tablosu th,
.rate-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}
.rate-manager {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}
</style>