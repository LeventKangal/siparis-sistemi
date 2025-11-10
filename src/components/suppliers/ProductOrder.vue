<template>
  <div class="siralama-paneli">
    <h2>Ürün Sıralaması</h2>

    <input v-model="searchTerm" placeholder="Ürün adıyla filtrele..." />

    <table>
      <thead>
        <tr>
          <th>Sıra</th>
          <th>Ürün Adı</th>
          <th>Üretici</th>
          <th style="text-align: center; width: 50px;">Yeni Sıra</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in filteredProducts":key="product.id">
          <td>{{ product.display_order}}</td>
          <td>{{ product.name}}</td>
          <td>{{ supplierName}}</td>
          <td class="order-column">
            <input v-model.number="product.newOrder" type="number" min="0" />
          </td>
        </tr>
      </tbody>
    </table>

    <button @click="saveOrder">💾 Sıralamayı Kaydet</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';

const companyName = localStorage.getItem('companyName')?.trim() || '';
const userMail = ref(localStorage.getItem('userEmail') || '');
const supplierId = ref(null);
const supplierName = ref('');
const products = ref([]);
const searchTerm = ref('');

onMounted(async () => {
  await fetchSupplierId();
  if (supplierId.value) {
    await fetchProductsForSupplier();
}
});

async function fetchSupplierId() {
  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name')
.eq('email', userMail.value)
.single();

  if (!error && data) {
    supplierId.value = data.id;
    supplierName.value = data.supplier_name;
} else {
    console.error('❌ Üretici ID alınamadı:', error);
}
}

async function fetchProductsForSupplier() {
  const { data, error} = await supabase
.from(`products_${companyName}`)
.select('id, name, display_order')
.eq('supplier_id', supplierId.value)
.order('display_order', { ascending: true});

  if (!error && data) {
    products.value = data.map(p => ({
...p,
      newOrder: p.display_order
}));
} else {
    console.error('❌ Ürünler alınamadı:', error);
}
}

const filteredProducts = computed(() =>
  products.value.filter(p =>
    p.name?.toLocaleLowerCase('tr-TR').includes(searchTerm.value.trim().toLocaleLowerCase('tr-TR'))
)
);

async function saveOrder() {
  // 🚫 Negatif sıra kontrolü
  if (filteredProducts.value.some(p => p.newOrder < 0)) {
    alert('Sıra numarası negatif olamaz.');
    return;
  }

  const updates = filteredProducts.value.map(p => ({
    id: p.id,
    display_order: p.newOrder
}));

  const { error} = await supabase
.from(`products_${companyName}`)
.upsert(updates);

  if (!error) {
    alert('✅ Sıralama başarıyla güncellendi.');
} else {
    console.error('❌ Sıralama güncelleme hatası:', error);
    alert('Sıralama kaydedilemedi.');
}
}
</script>

<style scoped>


.siralama-paneli {
  padding: 20px;
}
.siralama-paneli input[type="text"] {
  margin-bottom: 12px;
  padding: 6px;
  width: 150px;
  text-align: center;
  box-sizing: border-box;
}
.siralama-paneli table {
  width: 100%;
  border-collapse: collapse;
}
.siralama-paneli th,
.siralama-paneli td {
  padding: 8px;
  border: 1px solid #ccc;
}
button {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #2ecc71;
  color: white;
  border: none;
  cursor: pointer;
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

.order-column {
  text-align: center;
  width: 70px;
}
.order-column input {
  max-width: 100%;
  width: 70px;
  min-width: 40px;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
</style>
