<template>
  <div class="cargo-manager">
    <h2>Kargo Listesi</h2>
    <table class="cargo-tablosu">
      <thead>
        <tr>
          <th>Üretici No</th>
          <th>Üretici Adı</th>
          <th>Toplantı</th>
          <th>Ürün No</th>
          <th>Top.TL</th>
          <th>Top.Ağırlık</th>
          <th>Birim Fiyat</th>
          <th>Hazır mı?</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cargo in cargoList":key="cargo.supplier_id + '-' + cargo.meet_id">
          <td>{{ cargo.supplier_id}}</td>
          <td>{{ cargo.supplier_name}}</td>
          <td>{{ cargo.meet_id}}</td>

          <td v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id">
            <input v-model="editProductId" type="number" />
          </td>
          <td v-else>{{ cargo.product_id}}</td>

          <td v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id">
            <input v-model="editCharge" type="number" />
          </td>
          <td v-else>{{ cargo.total_charge}}</td>

          <td v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id">
            <input v-model="editUnit" type="number" />
          </td>
          <td v-else>{{ cargo.total_unit}}</td>

          <td v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id">
            <input v-model="editUnitqty" type="number" />
          </td>
          <td v-else>{{ cargo.unit_charge}}</td>

          <td v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id">
            <input type="checkbox" v-model="editReady" />
          </td>
          <td v-else>{{ cargo.isReady? '✅': '❌'}}</td>

          <td>
            <button v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id" @click="updateCargo(cargo)">💾</button>
            <button v-if="editingKey === cargo.supplier_id + '-' + cargo.meet_id" @click="cancelEdit">❌</button>
            <button v-else @click="startEdit(cargo)">📝</button>
            <button @click="deleteCargo(cargo)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="add-cargo-form">
      <h3>Yeni Kargo</h3>
      <input v-model="newSupplier" placeholder="Üretici id" type="number" />
      <input v-model="newSupplierName" placeholder="Üretici Adı" />
      <input v-model="newMeet" placeholder="Hafta no" />
      <input v-model="newProductId" placeholder="Ürün Kodu" />
      <input v-model="newCharge" placeholder="Top.TL" type="number" />
      <input v-model="newUnit" placeholder="Top.Ağırlık" type="number" />
      <label>
        <input type="checkbox" v-model="newReady" />
        Hazır mı?
      </label>
      <button @click="addCargo">➕ Ekle</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue'
import { cargoService} from '@/services/cargoService'
import type { Cargo} from '@/services/cargoService'

const cargoList = ref<Cargo[]>([])

const newSupplier = ref<number | null>(null)
const newSupplierName = ref('')
const newMeet = ref('')
const newProductId = ref('')
const newCharge = ref<number | null>(null)
const newUnit = ref<number | null>(null)
const newUnitqty = ref<number | null>(null)
const newReady = ref(false)

const editingKey = ref<string | null>(null)
const editProductID = ref<number | null>(null)
const editCharge = ref<number | null>(null)
const editUnit = ref<number | null>(null)
const editUnitqty = ref<number | null>(null)
const editReady = ref(false)

function startEdit(cargo: Cargo) {
  editingKey.value = cargo.supplier_id + '-' + cargo.meet_id
  editProductId.value = cargo.product_id?? null
  editCharge.value = cargo.total_charge?? null
  editUnit.value = cargo.total_unit?? null
  editUnitqty.value = cargo.unit_charge?? null
  editReady.value = cargo.isReady?? false
}

function cancelEdit() {
  editingKey.value = null
}

async function addCargo() {
  const yeni = await cargoService.insertOne({
    supplier_id: newSupplier.value!,
    supplier_name: newSupplierName.value!,
    meet_id: newMeet.value,
    product_id: newProductId.value,
    total_charge: newCharge.value,
    total_unit: newUnit.value,
    unit_charge: newUnitqty.value,
    isReady: newReady.value
})
  if (yeni) {
    cargoList.value.push(yeni)
    newSupplier.value = null
    newMeet.value = ''
    newProductId.value = null
    newCharge.value = null
    newUnit.value = null
    newReady.value = false
}
}
 
async function updateCargo(cargo: Cargo) {
  const updated = await cargoService.updateById(
    [cargo.supplier_id, cargo.meet_id],
    {
      total_charge: editCharge.value,
      product_id: editProductId.value,
      total_unit: editUnit.value,
      unit_charge: editUnitqty.value,
      isReady: editReady.value
}
)
  if (updated) {
    const i = cargoList.value.findIndex(
      c => c.supplier_id === cargo.supplier_id && c.meet_id === cargo.meet_id
)
    cargoList.value[i] = updated
    cancelEdit()
}
}

async function deleteCargo(cargo: Cargo) {
  if (confirm('Bu kargo silinsin mi?')) {
const ok = await cargoService.deleteById([cargo.supplier_id, cargo.meet_id])
    if (ok) {
      cargoList.value = cargoList.value.filter(
        c =>!(c.supplier_id === cargo.supplier_id && c.meet_id === cargo.meet_id)
)
}
}
}

onMounted(async () => {
  cargoList.value = await cargoService.getAll()
})
</script>

<style scoped>

.cargo-tablosu th,
.cargo-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}
.cargo-manager {
  padding: 20px;
}
.add-cargo-form {
  margin-top: 20px;
}
</style>