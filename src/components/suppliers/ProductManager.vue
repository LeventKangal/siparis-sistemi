<template>
  <div class="product-manager">
    <h2>Ürün Listesi</h2>
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
          <th class="active-column">Aktif</th>
          <th class="description-column">Açıklama</th>
          <th class="islem-column">İşlem</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="product in productList":key="product.id">
          <td class="supplier-column">{{ product.supplier_name}}</td>
          <td class="name-column">
            {{ product.name?.slice(0, 25)}}
            <span v-if="product.name && product.name.length> 25">...</span>
          </td>
          <td v-if="editingId === product.id" class="unit-column"><input v-model="editUnit" maxlength="15" /></td>
          <td v-else class="unit-column" style="text-align: left;">{{ product.unit}}</td>

          <td v-if="editingId === product.id" class="price-column"><input v-model.number="editPrice" type="number" /></td>
          <td v-else class="price-column" style="text-align: right;">{{ formatPrice(product.price)}} ₺</td>

          <td v-if="editingId === product.id" class="stock-column"><input v-model.number="editStock" type="number" /></td>
          <td v-else class="stock-column" style="text-align: right;">{{ product.stock}}</td>

          <td v-if="editingId === product.id" class="max-column"><input
          v-model.number="editMax" type="number"
          :disabled="userType === 'U'" /></td>
          <td v-else class="max-column" style="text-align: center;">{{ product.max_quantity || '—'}}</td>

          <td v-if="editingId === product.id" class="min-column"><input
          v-model.number="editMin" type="number"
          :disabled="userType === 'U'" /></td>
          <td v-else class="min-column" style="text-align: center;">{{ product.min_quantity || '—'}}</td>

          <td v-if="editingId === product.id" class="active-column"><input type="checkbox" v-model="editActive" /></td>
          <td v-else class="active-column">
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
<div class="form-container">
  <input type="text" v-model="sabitSupplierName" disabled />
  <input v-model="newName" placeholder="Ürün Adı     Lütfen En fazla 25 karakter girin."  maxlength="25"  />
  <input v-model="newUnit" placeholder="Birim   (kg.  100gr.  adet  demet  250ml şişe  660cc kavanoz)" maxlength="15"/>
  <input v-model.number="newPrice" type="number" placeholder="Fiyat" />
  <input v-model.number="newStock" type="number" placeholder="Elde mevcut Ürün sayısı (Stok)" />
  <input
  v-model.number="newMax" type="number"
  :disabled="userType === 'U'"
  placeholder="En fazla satın alınabilecek Miktar. Kısıtlama yoksa boş bırakın." />
  <input
  v-model.number="newMin" type="number"
  :disabled="userType === 'U'"
  placeholder="En az satın alınabilecek Miktar" />
  <textarea v-model="newDescription" placeholder="Ürünle ilgili Açıklamaları buraya girin."></textarea>
  <button @click="addProduct">➕ Ekle</button>
</div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService.js';
import { supplierService} from '@/services/supplierService';
import type { Product} from '@/services/productService';
import type { Supplier} from '@/services/supplierService';
import { formatPrice} from '@/utils/formatters';

// 🔧 Yardımcı Fonksiyon: Tablo adı oluştur

const companyName = localStorage.getItem('companyName')?.trim() || '';
const userType = localStorage.getItem('userType')?.trim();

// 📦 Ürün ve tedarikçi verileri
const productList = ref<Product[]>([]);
const sabitSupplierName = ref('');
const sabitSupplierId = ref<number | null>(null);

// 🆕 Yeni ürün formu
const newName = ref('');
const newUnit = ref('');
const newPrice = ref<number | null>(null);
const newStock = ref<number | null>(null);
const newMax = ref<number | null>(null);
const newMin = ref<number | null>(null);
const newDescription = ref('');

// ✏️ Düzenleme alanları
const editingId = ref<number | null>(null);
const editUnit = ref('');
const editPrice = ref<number | null>(null);
const editStock = ref<number | null>(null);
const editMax = ref<number | null>(null);
const editMin = ref<number | null>(null);
const editActive = ref(true);
const editDescription = ref('');
const shownDescriptionId = ref<number | null>(null);

// 📌 Açıklama kutusunu aç/kapat
function toggleDescription(id: number) {
  shownDescriptionId.value = shownDescriptionId.value === id? null: id;
}

// 🛠️ Ürün düzenleme başlat
function startEdit(product: Product) {
  editingId.value = product.id;
  editUnit.value = product.unit?? '';
  editPrice.value = product.price?? null;
  editStock.value = product.stock?? null;
  editMax.value = product.max_quantity?? null;
  editMin.value = product.min_quantity?? null;
  editDescription.value = product.description?? '';
  editActive.value = product.isActive?? true;
}

function cancelEdit() {
  editingId.value = null;
}

// 💾 Ürün güncelle
async function updateProduct(id: number) {

  if (editUnit.value.length> 15) {
    alert("Birim alanı en fazla 15 karakter olabilir.")
    return
}

  const { data, error} = await supabase
.from(`products_${companyName}`)
.update({
      unit: editUnit.value,
      price: editPrice.value?? undefined,
      stock: editStock.value?? undefined,
      max_quantity: editMax.value?? undefined,
      min_quantity: editMin.value?? undefined,
      description: editDescription.value,
      isActive: editActive.value,
})
.eq('id', id)
.select();

  if (!error && data?.[0]) {
    const index = productList.value.findIndex(p => p.id === id);
    if (index!== -1) productList.value[index] = data[0];
    cancelEdit();
} else {
    console.error('Güncelleme hatası:', error?.message);
}
}

// ➕ Yeni ürün ekle
async function addProduct() {

  if (newName.length> 25) {
    alert("Ürün adı en fazla 25 karakter olabilir.")
    return
}
  if (newUnit.length> 15) {
    alert("Birim alanı en fazla 15 karakter olabilir.")
    return
}

  const { data, error} = await supabase
.from(`products_${companyName}`)
.insert([{
      supplier_name: sabitSupplierName.value,
      supplier_id: sabitSupplierId.value,
      name: newName.value,
      unit: newUnit.value,
      price: newPrice.value?? undefined,
      stock: newStock.value?? undefined,
      max_quantity: newMax.value?? undefined,
      min_quantity: newMin.value?? undefined,
      description: newDescription.value,
}])
.select();

  if (!error && data?.[0]) {
    productList.value.push(data[0]);
    newName.value = '';
    newUnit.value = '';
    newPrice.value = null;
    newStock.value = null;
    newMax.value = null;
    newMin.value = null;
    newDescription.value = '';
} else {
    console.error('Ekleme hatası:', error?.message);
}
}

// 🗑️ Ürün pasifleştir veya sil
async function deleteProduct(id: number) {
  if (!confirm('Bu ürün silinsin mi?')) return;

  try {
    // Sipariş kontrolü
    const { data: orderItems, error: orderError} = await supabase
.from(`order_items_${companyName}`)
.select('product_id')
.eq('product_id', id);


    if (orderError) throw new Error('Sipariş kontrol hatası: ' + orderError.message);

    if (!orderItems || orderItems.length === 0) {
      // Silme işlemi
      const { error: deleteError} = await supabase
.from(`products_${companyName}`)
.delete()
.eq('id', id);

      if (deleteError) throw new Error('Silme hatası: ' + deleteError.message);

      // Silme sonrası kontrol
      const { data: checkData, error: checkError} = await supabase
.from(`products_${companyName}`)
.select('id')
.eq('id', id);

      if (checkError) throw new Error('Silme sonrası kontrol hatası: ' + checkError.message);

      if (checkData.length === 0) {
        alert('✅ Kayıt başarıyla silindi.');
        productList.value = productList.value.filter(p => p.id!== id);
} else {
        console.warn('⚠️ Silme işlemi gerçekleşmedi, kayıt hâlâ duruyor.');
}
} else {
      // Pasifleştirme işlemi
      const { error: updateError} = await supabase
.from(`products_${companyName}`)
.update({ isActive: false})
.eq('id', id);

  alert(`ℹ️ Ürün pasifleştirildi çünkü ${orderItems.length} adet siparişle ilişkili.`);

      if (updateError) throw new Error('Pasifleştirme hatası: ' + updateError.message);
      productList.value = productList.value.filter(p => p.id!== id);
}
} catch (err) {
    console.error('🚨 Hata:', err.message);
}
}

onMounted(async () => {
  const userEmail = localStorage.getItem('userEmail')?.trim();


  // 🔍 Tedarikçiyi bul
  const allSuppliers = await supplierService.getAll();
  const current = allSuppliers.find(
    s => s.email?.trim().toLowerCase() === userEmail?.toLowerCase()
);

  if (!current) {
    console.warn('Tedarikçi bulunamadı.');
    productList.value = [];
    return;
}

  sabitSupplierName.value = current.supplier_name?? '';
  sabitSupplierId.value = current.id?? null;

  // 📦 Sadece bu tedarikçiye ait aktif ürünleri getir
  const { data: userProducts, error} = await supabase
.from(`products_${companyName}`)
.select('*')
.eq('supplier_id', sabitSupplierId.value);
//.eq('isActive', true);

  if (error ||!userProducts) {
    console.error('Veri çekme hatası:', error?.message);
    productList.value = [];
    return;
}

  // ✅ Ürünleri sırala ve ata
  productList.value = userProducts.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
});

</script>

<style scoped>

.product-manager {
  padding: 15px;

}

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


.urun-tablosu {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  font-family: sans-serif;
  font-size: 14px;
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
  width: 60px;
}
.name-column {
  text-align: left;
  width: 120px;
}
.unit-column {
  text-align: left;
  width: 120px;
}
.unit-column input {
  max-width: 100%;
  width: 60px;
  min-width: 40px;
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
  width: 45px;
}
.max-column input {
  max-width: 100%;
  width: 35px;
  min-width: 25px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}

.min-column {
  text-align: center;
  width: 40px;
}
.min-column input {
  max-width: 100%;
  width: 35px;
  min-width: 25px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.active-column {
  text-align: center;
  width: 40px;
  vertical-align: middle;
}
.description-column {
  text-align: center;
  width: 50px;
}
.islem-column {
  text-align: center;
  width: 80px;
}

button {
  margin: 2px;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e0e0e0;
}

.desc-box {
  margin-top: 6px;
  padding: 4px;
  border: 1px dashed #aaa;
  background-color: #fafafa;
}
.form-container input,
.form-container textarea,
.form-container button {
  display: block;
  margin: 6px 0;
  padding: 6px;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
}

.product-manager button {
  width: fit-content;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
}

.product-manager button:hover {
  background-color: #e0e0e0;
}

</style>
