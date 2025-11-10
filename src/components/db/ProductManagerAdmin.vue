<template>
  <div class="product-manager">
    <h2>Ürün Listesi</h2>

    <!-- Admin için tedarikçi seçimi -->
    <div v-if="userType === 'A'">
      <label>Tedarikçi Seç:</label>
<select v-model="selectedSupplierId" @change="updateSelectedSupplierName">
  <option disabled value="">-- Seçiniz --</option>
  <option v-for="s in sortedSuppliers":key="s.id":value="s.id">
    {{ s.name}}
  </option>
</select>
    </div>

    <table class="urun-tablosu">
      <thead>
        <tr>
          <th class="supplier-column">Üretici</th>
          <th class="name-column">Ürün Adı</th>
          <th class="unit-column">Birim</th>
          <th class="price-column">Fiyat</th>
          <th class="stock-column">Stok</th>
          <th class="max-column">Max</th>
          <th class="min-column">Min</th>
          <th class="kod-column">Kod</th>
          <th v-show="isCargo">Kargo</th>
          <th class="active-column">Aktif</th>
          <th class="description-column">Açıklama</th>
          <th class="islem-column">İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in productList":key="product.id">
          <td>{{ product.supplier_name}}</td>
          <td>
           {{ product.name? product.name.slice(0, 25): ''}}
           <span v-if="product.name && product.name.length> 25">...</span>
          </td>

          <td v-if="editingId === product.id" class="unit-column"><input v-model="editUnit" /></td>
          <td v-else class="unit-column" style="text-align: left;">{{ product.unit}}</td>

          <td v-if="editingId === product.id" class="price-column"><input v-model.number="editPrice" type="number" /></td>
          <td v-else class="price-column" style="text-align: right;">{{ product.price}}</td>

          <td v-if="editingId === product.id" class="stock-column"><input v-model.number="editStock" type="number" /></td>
          <td v-else class="stock-column" style="text-align: right;">{{ product.stock}}</td>

          <td v-if="editingId === product.id" class="max-column"><input v-model.number="editMax" type="number" /></td>
          <td v-else class="max-column" style="text-align: center;">{{ product.max_quantity || '—'}}</td>

          <td v-if="editingId === product.id" class="min-column"><input v-model.number="editMin" type="number" /></td>
          <td v-else class="min-column" style="text-align: center;">{{ product.min_quantity || '—'}}</td>

          <td v-if="editingId === product.id" class="kod-column"><input v-model="editcatalogId" /></td>
          <td v-else class="kod-column" style="text-align: center;">{{ product.catalog_id}}</td> 
         
          <td v-show="isCargo && editingId === product.id" class="kargo-column"><input v-model.number="editCargo" type="number" /></td>
          <td v-show="isCargo && editingId!== product.id" class="kargo-column">{{ product.cargo_quantity}}</td>
          
          <td v-if="editingId === product.id"><input type="checkbox" v-model="editActive" /></td>
          <td v-else>
            <span :style="{ color: product.isActive? 'green': 'red'}">
              {{ product.isActive? 'Aktif': 'Pasif'}}
            </span>
          </td>
          <td>

            <button @click="toggleDescription(product.id)">
              {{ shownDescriptionId === product.id? 'Gizle': 'Görüntüle'}}
            </button>
            <div v-if="shownDescriptionId === product.id" class="desc-box">
              <textarea v-if="editingId === product.id" v-model="editDescription" />
              <div v-else>{{ product.description}}</div>
            </div>
          </td>

          <td>
            <button v-if="editingId === product.id" @click="updateProduct(product.id)">💾</button>
            <button v-if="editingId === product.id" @click="cancelEdit">❌</button>
            <button v-else @click="startEdit(product)">📝</button>
            <button @click="deleteProduct(product.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>Yeni Ürün</h3>
    <input v-model="newName" placeholder="Ad" />
    <input v-model="newUnit" placeholder="Birim" />
    <input v-model.number="newPrice" type="number" placeholder="Fiyat" />
    <input v-model.number="newStock" type="number" placeholder="Stok" />
    <input v-model.number="newMax" type="number" placeholder="Max Miktar" />
    <input v-model.number="newMin" type="number" placeholder="Min Miktar" />
    <textarea v-model="newDescription" placeholder="Açıklama"></textarea>
    <button @click="addProduct">➕ Ekle</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed} from 'vue';
import { productService} from '@/services/productService';
import { supplierService} from '@/services/supplierService';
import type { Product} from '@/services/productService';
import type { Supplier} from '@/services/supplierService';

const allSuppliers = ref<Supplier[]>([]);
const productList = ref<Product[]>([]);
const userType = ref('');
const selectedSupplierId = ref<number | null>(null);
const selectedSupplierName = ref('');
const isCargo = ref(true); // Varsayılan olarak gösterilsin

const newName = ref('');
const newUnit = ref('');
const newPrice = ref<number | null>(null);
const newStock = ref<number | null>(null);
const newMax = ref<number | null>(null);
const newMin = ref<number | null>(null);
const newDescription = ref('');
const newcatalogId = ref<number | null>(null);

const editingId = ref<number | null>(null);
const editUnit = ref('');
const editPrice = ref<number | null>(null);
const editStock = ref<number | null>(null);
const editMax = ref<number | null>(null);
const editMin = ref<number | null>(null);
const editcatalogId = ref<number | null>(null);
const editDescription = ref('');
const editActive = ref<boolean>(true);
const editCargo = ref<number | null>(null);
const shownDescriptionId = ref<number | null>(null);

const sortedSuppliers = computed(() => {
  return [...allSuppliers.value]
  .filter(s => s.isActive === true)
  .sort((a, b) => a.id - b.id);
});


function toggleDescription(id: number) {
  shownDescriptionId.value = shownDescriptionId.value === id? null: id;
}

function startEdit(product: Product) {
  editingId.value = product.id;
  editUnit.value = product.unit?? '';
  editPrice.value = product.price?? null;
  editStock.value = product.stock?? null;
  editMax.value = product.max_quantity?? null;
  editMin.value = product.min_quantity?? null;
  editcatalogId.value = product.catalog_id?? null;
  editDescription.value = product.description?? '';
  editActive.value = product.isActive?? true;
  editCargo.value = product.cargo_quantity?? null;
}

function cancelEdit() {
  editingId.value = null;
}

watch(selectedSupplierId, async (newId) => {
  if (userType.value === 'A' && newId) {
    const allProducts = await productService.getAll();
    const selected = allSuppliers.value.find(s => s.id === newId);
    selectedSupplierName.value = selected?.supplier_name?? '';


    productList.value = allProducts
.filter(p => Number(p.supplier_id) === Number(newId) && p.isActive!== false)
.sort((a, b) => a.id - b.id);
}
});

async function updateProduct(id: number) {
  const updated = await productService.updateById(id, {
    unit: editUnit.value,
    price: editPrice.value?? null,
    stock: editStock.value?? null,
    max_quantity: editMax.value?? null,
    min_quantity: editMin.value?? null,
    catalog_id: editcatalogId.value?? null,
    description: editDescription.value,
    isActive: editActive.value,
    cargo_quantity: editCargo.value?? null
});
  if (updated) {
    const i = productList.value.findIndex(p => p.id === id);
    if (i!== -1) productList.value[i] = updated;
    cancelEdit();
}
}

async function addProduct() {
  if (userType.value === 'A' && (!selectedSupplierId.value ||!selectedSupplierName.value)) {
    alert('Lütfen bir tedarikçi seçin.');
    return;
}

  const yeni = await productService.insertOne({
    supplier_id: selectedSupplierId.value,
    supplier_name: selectedSupplierName.value,
    name: newName.value,
    unit: newUnit.value,
    price: newPrice.value?? null,
    stock: newStock.value?? null,
    max_quantity: newMax.value?? null,
    min_quantity: newMin.value?? null,
    catalog_id: newcatalogId.value?? null,
    description: newDescription.value
});

  if (yeni) {
    productList.value.push(yeni);
    newName.value = '';
    newUnit.value = '';
    newPrice.value = null;
    newStock.value = null;
    newMax.value = null;
    newMin.value = null;
    newcatalogId.value = null;
    newDescription.value = '';
}
}

async function deleteProduct(id: number) {
  if (confirm('Bu ürün silinsin mi?')) {
    const ok = await productService.deleteById(id);
    if (ok) productList.value = productList.value.filter(p => p.id!== id);
}
}

function updateSelectedSupplierName() {
  const selected = allSuppliers.value.find(s => s.id === selectedSupplierId.value);
  selectedSupplierName.value = selected?.supplier_name?? '';
}

onMounted(async () => {
  userType.value = localStorage.getItem('userType')?? '';
  const userEmail = localStorage.getItem('userEmail');
  const allProducts = await productService.getAll();

  allSuppliers.value = await supplierService.getAll();
  

  if (userType.value === 'A') {
    productList.value = allProducts.sort((a, b) => a.id - b.id);
} else if (userType.value === 'U') {
    const current = allSuppliers.value.find(s => s.email === userEmail);
    const supplierKey = current?.name?.trim();
    if (supplierKey) {
      productList.value = allProducts
.filter(p => p.supplier_name?.trim() === supplierKey && p.isActive!== false)
.sort((a, b) => a.id - b.id);
} else {
      productList.value = [];
}
}

   
});


</script>



<style scoped>

/* Chrome, Safari, Edge */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

.product-manager {
  padding: 16px;
  max-width: 1000px;
  margin: auto;
}
.product-manager input,
.product-manager textarea {
  display: block;
  margin: 4px 0;
  padding: 6px;
  max-width: 400px;
}
.desc-box {
  margin-top: 6px;
  padding: 8px;
  background: #f9f9f9;
  border: 1px solid #ccc;
  white-space: pre-wrap;
}
.urun-tablosu th,
.urun-tablosu td {
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
  padding: 4px;
  font-size: 14px;
}

.urun-tablosu th {
  background-color: #f5f5f5;
  font-weight: bold;
}
.supplier-column {
  text-align: left;
  width: 90px;
}
.name-column {
  text-align: left;
  width: 200px;
}
.unit-column {
  text-align: left;
  width: 150px;
}
.unit-column input {
  max-width: 100%;
  width: 120px;
  min-width: 80px;
  padding: 4px;
  box-sizing: border-box;
}
.price-column {
  text-align: right;
  width: 60px;
}
.price-column input {
  max-width: 100%;
  width: 60px;
  min-width: 40px;
  padding: 4px;
  box-sizing: border-box;
  text-align: right;
}
.stock-column {
  text-align: right;
  width: 50px;
}
.stock-column input {
  max-width: 100%;
  width: 60px;
  min-width: 40px;
  padding: 4px;
  box-sizing: border-box;
  text-align: right;
}
.max-column {
  text-align: center;
  width: 25px;
}
.max-column input {
  max-width: 100%;
  width: 20px;
  min-width: 15px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}

.min-column {
  text-align: center;
  width: 25px;
}
.min-column input {
  max-width: 100%;
  width: 20px;
  min-width: 15px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.kod-column {
  text-align: center;
  width: 25px;
}
.kod-column input {
  max-width: 100%;
  width: 20px;
  min-width: 15px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.kargo-column {
  text-align: center;
  width: 40px;
}
.kargo-column input {
  max-width: 100%;
  width: 40px;
  min-width: 35px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.islem-column {
  text-align: center;
  width: 75px;
}
</style>