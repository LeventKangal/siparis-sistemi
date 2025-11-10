<template>
  <div class="supplier-manager">
    <h2>Tedarikçi Listesi</h2>
    <table class="supplier-tablosu">
      <thead>
  <tr>
    <th>ID</th>
    <th>Ad</th>
    <th>Konum</th>
    <th>Email</th> <!-- Yeni eklendi -->
    <th>Aktif mi?</th>
    <th>Kargolu mu?</th>
    <th>İşlem</th>
  </tr>
</thead>
      <tbody>
        <tr v-for="supplier in supplierList" :key="supplier.id">
  <td>{{ supplier.id}}</td>

  <td v-if="editingId === supplier.id">
    <input v-model="editName" />
  </td>
  <td v-else>{{ supplier.name}}</td>

  <td v-if="editingId === supplier.id">
    <input v-model="editLocation" />
  </td>
  <td v-else>{{ supplier.location}}</td>

   <td v-if="editingId === supplier.id">
    <input v-model="editEmail" />
   </td>
   <td v-else>{{ supplier.email}}</td>
  
  <td v-if="editingId === supplier.id">
    <input type="checkbox" v-model="editActive" />
  </td>
  <td v-else>{{ supplier.isActive? '✅': '❌'}}</td>

  <td v-if="editingId === supplier.id">
    <input type="checkbox" v-model="editCargo" />
  </td>
  <td v-else>{{ supplier.isCargo? '✅': '❌'}}</td>

  <td>
    <button v-if="editingId === supplier.id" @click="updateSupplier(supplier.id)">💾</button>
    <button v-if="editingId === supplier.id" @click="cancelEdit">❌</button>
    <button v-else @click="startEdit(supplier)">📝</button>
    <button @click="deleteSupplier(supplier.id)">🗑️</button>
  </td>
</tr>
      </tbody>
    </table>

    <h3>Yeni Tedarikçi</h3>
    <input v-model="newid" placeholder="Sıralama" />
    <input v-model="newcode" placeholder="Kısa Ad" />
    <input v-model="newName" placeholder="Ad" />
    <input v-model="newLocation" placeholder="Konum" />
    <input v-model="newEmail" placeholder="Email" />
    
    

    
<label style="display: inline-flex; align-items: center; gap: 4px;">
  <input type="checkbox" v-model="newActive" />
  Aktif mi?
</label>

<label style="display: inline-flex; align-items: center; gap: 4px;">
  <input type="checkbox" v-model="newCargo" />
  Kargolu mu?
</label>
    <button @click="addSupplier">➕ Ekle</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue';
import { supplierService} from '@/services/supplierService';
import type { Supplier} from '@/services/supplierService';


const supplierList = ref<Supplier[]>([]);

const newName = ref('');
const newLocation = ref('');
const newCargo = ref(false);
const newActive = ref(false);
const newEmail = ref('');
const newid = ref('');
const newcode = ref('');


const editEmail = ref('');
const editingId = ref<number | null>(null);
const editName = ref('');
const editLocation = ref('');
const editActive = ref(false);
const editCargo= ref(false);

function startEdit(supplier: Supplier) {
  editingId.value = supplier.id;
  editName.value = supplier.name?? '';
  editLocation.value = supplier.location?? '';
  editActive.value = supplier.isActive?? false;
  editCargo.value = supplier.isCargo?? false;
  editEmail.value = supplier.email?? '';
}

function cancelEdit() {
  editingId.value = null;
}

async function addSupplier() {
  const yeni = await supplierService.insertOne({
    name: newName.value,
    location: newLocation.value,
    isActive: newActive.value,
    isCargo: newCargo.value,
    email: newEmail.value,
    id: newid.value,
    supplier_name: newcode.value

});
  if (yeni) {
    supplierList.value.push(yeni);
    newName.value = '';
    newLocation.value = '';
    newActive.value = false;
    newCargo.value = false;
    newEmail.value = '';
    newid.value = '';
    newcode.value = '';
}
}

async function updateSupplier(id: number) {
  const updated = await supplierService.updateById(id, {
    name: editName.value,
    location: editLocation.value,
    isActive: editActive.value,
    isCargo: editCargo.value,
    email: editEmail.value
});
  if (updated) {
    const i = supplierList.value.findIndex(s => s.id === id);
    supplierList.value[i] = updated;
    cancelEdit();
}
}


async function deleteSupplier(id: number) {
  if (confirm('Bu tedarikçi silinsin mi?')) {
    const ok = await supplierService.deleteById(id);
    if (ok) supplierList.value = supplierList.value.filter(s => s.id!== id);
}
}
onMounted(async () => {
  const response = await supplierService.getAll();
  supplierList.value = response.sort((a, b) => a.id - b.id);
});
//onMounted(async () => {
// supplierList.value = await supplierService.getAll();
//});

</script>

<style scoped>
.supplier-tablosu th,
.supplier-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}

.supplier-manager td:nth-child(2), /* 2. sütun: Ad */
.supplier-manager th:nth-child(2) {
  text-align: left;
  width: 25ch; /* karakter bazlı genişlik */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.supplier-manager td:nth-child(3), /* 3. sütun: Konum */
.supplier-manager th:nth-child(3) {
  text-align: left;
  width: 35ch; /* karakter bazlı genişlik */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.supplier-manager td:nth-child(4), /* 4. sütun: E mail */
.supplier-manager th:nth-child(4) {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.supplier-manager td:nth-child(7), /* 7. sütun: İşlem */
.supplier-manager th:nth-child(7) {
  text-align: center;
  width: 55ch; /* karakter bazlı genişlik */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.supplier-manager {
  padding: 16px;
  max-width: 700px;
  margin: auto;
}
.supplier-manager input {
  margin: 4px;
  padding: 6px;
}

</style>