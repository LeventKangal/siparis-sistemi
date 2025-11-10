<template>
  <div class="kasa-entry">
    <h2>Türetici Siparişleri</h2>

    <!-- 👤 Müşteri Seçimi -->
    <label>Türetici :</label>
    <select v-model="selectedCustomer" @change="fetchOrders">
      <option value="">Seçiniz...</option>
      <option v-for="c in customerList":key="c.email":value="c.email">
  {{ c.name}}{{ c.supplier_mail? ' - Üretici': ''}}
       </option>
    </select>

    <!-- 📦 Sipariş Tablosu -->
    <table v-if="orders.length> 0" style="margin-top: 20px;">
      <thead>
        <tr>
          <th style="width: 90px">Üretici</th>
          <th>Ürün</th>
          <th>Birim</th>
          <th style="text-align: right;">Birim Fiyat</th>
          <th style="text-align: center;">Miktar</th>
          <th style="text-align: right;">Toplam</th>
          <th style="text-align: center;">İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in orders" :key="item.product_id + '_' + item.supplier_id">
          <td>{{ item[`suppliers_${companyName}`]?.supplier_name?.substring(0, 15)}}</td>
          <td>{{ item.name?.substring(0, 30)}}</td>
          <td>
  {{
    productList.find(p => p.id === item.product_id)?.unit?.substring(0, 15)
}}
          </td>
          <td style="text-align: right;">{{ formatPrice(item.price)}} ₺</td>
          <td style="text-align: center;">
    <input type="number" v-model.number="item.quantity" min="0" style="width: 60px;" />
    <button @click="handleUpdate(item)" style="margin-left: 6px;":disabled="item.loading"
    :class="{ success: item.updated}">
       {{ item.loading? '⏳': item.updated? '✅': '💾'}}
    </button>
  </td>
          <td style="text-align: right;">{{ formatPrice(item.price * item.quantity)}} ₺</td>
          <td style="text-align: center;">
            <button @click="deleteOrder(item)" style="padding: 4px 8px;">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
</div>
    <!-- 🆕 Yeni Ürün Ekleme -->
<div v-if="selectedCustomer" style="margin-top: 30px;">
  <h3>Yeni Ürün Ekle</h3>

  <!-- 🏭 Üretici Seçimi -->
  <label>Üretici:</label>
  <select v-model="selectedSupplierId" @change="fetchProductsBySupplier">
    <option disabled value="">Üretici seçin</option>
    <option  v-for= "s in supplierList" :key="s.id" :value="s.id">
  {{ s.name || 'İsimsiz'}}
    </option>
  </select>

  <!-- 📦 Ürün Seçimi -->
  <label>Ürün:</label>
  <select v-model="selectedProductId">
    <option disabled value="">Ürün seçin</option>
    <option v-for="p in filteredProducts":key="p.id":value="p.id">
      {{ p.name}} ({{ p.unit}})
    </option>
  </select>

  <label>Miktar:</label>
  <input type="number" v-model.number="newQuantity" placeholder="Miktar" min="1" />



  <button @click="addOrderItem">➕ Sipariş Ekle</button>
</div>
    <!-- 💰 Toplamlar ve Ödeme Butonu -->
    <div v-if="orders.length> 0" style="text-align: right; margin-top: 20px;">
  <h4>Ara Toplam: {{ formatPrice(totalAmount)}} ₺</h4>
  <h4>Kasa Payı: {{ formatPrice(rate)}} ₺</h4>
  <h4>Genel Toplam: {{ formatPrice(totalAmount + rate)}} ₺</h4>

  <div v-if="isSplitPayment" style="margin-top: 10px;">
  <div style="display: flex; gap: 12px; margin-bottom: 10px; margin-left: 600px;">
  <div>
    <label>Nakit:</label>
    <input v-model.number="payment_nakit" type="number" />
  </div>
  <div>
    <label>EFT:</label>
    <input v-model.number="payment_eft" type="number" />
  </div>
  <div>
    <label>Kredi:</label>
    <input v-model.number="payment_kredi" type="number" />
  </div>
</div>
</div>

<div style="margin-top: 10px; margin-left: 800px;">
  <label>
    <input type="checkbox" v-model="isSplitPayment"/>
    Parçalı ödeme mi?
  </label>
</div>

      <div style="text-align: right; margin-top: 20px;">
        <label for="paymentType">Ödeme Türü:</label>
        <select id="paymentType" v-model="paymentType" style="margin-left: 10px; padding: 6px;">
              <option value="nakit">Nakit</option>
              <option value="eft" >EFT</option>
              <option value="kredi" >Kredi Kartı</option>
        </select>

        <button @click="submitPayment" style="margin-left: 10px; padding: 10px 20px;">
          💳 Ödeme Yapıldı
        </button>
      </div>
    </div>

</template>

<script setup>
import { ref, onMounted, computed, watch} from 'vue';
import supabase from '@/services/supabaseService';
import { fetchRateForAmount} from '@/services/rateService';
import { recordPayment} from '@/services/paymentService';
import { formatPrice} from '@/utils/formatters';

const orders = ref([]);
const rate = ref(0);
const customerList = ref([]);
const selectedCustomer = ref('');
const meetId = localStorage.getItem('meetId') || '';
const companyName = localStorage.getItem('companyName') || '';
const paymentType = ref('nakit');
const productList = ref([]);
const selectedProductId = ref('');
const newQuantity = ref(1);
const newDescription = ref('');
const supplierList = ref([]);
const selectedSupplierId = ref('');
const filteredProducts = ref([]);

const isSplitPayment = ref(false);
const payment_nakit = ref(0);
const payment_eft = ref(0);
const payment_kredi = ref(0);

//const user_type = ref('');



// 🔹 Toplam tutar
const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 🔹 Üretici ise Parçalı Ödeme kapatılacak, sadece "Nakit" ödeme yapılabilir.
const selectedCustomerIsSupplier = computed(() => {
  const customer = customerList.value.find(c => c.email === selectedCustomer.value);
  return customer?.supplier_mail? true: false;
});

// 🔹 Müşteri listesi (sadece sipariş vermiş ve ödememiş olanlar)
async function fetchCustomers() {
  const { data: users, error: userError} = await supabase
.from(`users_${companyName}`)
.select('name, email, supplier_mail, user_type')
.order('name', { ascending: true}) // ✅ Alfabetik sıralama

  if (userError ||!users) {
    console.error('❌ Müşteri listesi alınamadı:', userError);
    customerList.value = [];
    return;
}

  const { data: paidRecords} = await supabase
.from(`orders_${companyName}`)
.select('name')
.eq('meet_id', meetId)
.eq('isChecked', true);

  const paidNames = (paidRecords || []).map(r => r.name);

  const { data: ordersRaw} = await supabase
.from(`order_items_${companyName}`)
.select('user_mail', { distinct: true})
.eq('meet_id', meetId);

  const orderEmails = (ordersRaw || []).map(o => o.user_mail);

  customerList.value = users.filter(
    user => orderEmails.includes(user.email) &&!paidNames.includes(user.name)
);
}

// 🔹 Seçilen müşterinin siparişlerini getir
async function fetchOrders() {
  localStorage.setItem('consumer_email', selectedCustomer.value);

  if (!selectedCustomer.value ||!meetId) {
    console.warn('❌ Müşteri veya toplantı ID eksik.');
    return;
}

  const { data, error} = await supabase
.from(`order_items_${companyName}`)
.select(`
      name,
      description,
      price,
      quantity,
      product_id,
      supplier_id,
      user_mail,
      suppliers_${companyName} (
        supplier_name
)
    `)
.eq('user_mail', selectedCustomer.value)
.eq('meet_id', meetId)
.order('supplier_id', { ascending: true})

  if (error) {
    console.error('❌ Supabase hata:', error);
    return;
}

  if (!data || data.length === 0) {
    console.warn('⚠️ Veri boş geldi veya eşleşme yok.');
    orders.value = [];
    rate.value = 0;
    return;
}

  orders.value = data.filter(item => item.quantity> 0)
  .map(item => ({
...item,
    loading: false,
    updated: false
}));

  await recalculateRate();
}

//Miktar güncelleme hareketi
async function handleUpdate(item) {
  item.loading = true;
  await updateQuantity(item);
  item.loading = false;
  item.updated = true;
  setTimeout(() => item.updated = false, 2000);
}

// 🔹 Miktar güncelleme
async function updateQuantity(item) {
  if (item.quantity < 0) {
    alert('❌ Miktar negatif olamaz.');
    return;
}

  const { error} = await supabase
.from(`order_items_${companyName}`)
.update({ quantity: item.quantity})
.eq('user_mail', item.user_mail)
.eq('meet_id', meetId)
.eq('product_id', item.product_id)
.eq('supplier_id', item.supplier_id);

  if (error) {
    console.error('❌ Miktar güncelleme hatası:', error.message);
} else {
    await recalculateRate();
        //console.log('Miktar güncellendi');
}
}

// 🔹 Sipariş silme
async function deleteOrder(item) {
  const confirmDelete = confirm('Bu siparişi silmek istediğinize emin misiniz?');
  if (!confirmDelete) return;

  const { error} = await supabase
.from(`order_items_${companyName}`)
.delete()
.eq('user_mail', item.user_mail)
.eq('meet_id', meetId)
.eq('product_id', item.product_id)
.eq('supplier_id', item.supplier_id);

  if (error) {
    console.error('❌ Silme hatası:', error.message);
} else {
    orders.value = orders.value.filter(o =>
      o.product_id!== item.product_id || o.supplier_id!== item.supplier_id
);
    await recalculateRate();
}
}
 // Arşivde var mı Kontrollü
 async function fetchArchivedPaymentInfo(name) {
  const archiveTable = `orders_archive_${companyName}`;

  const { data, error } = await supabase
    .from(archiveTable)
    .select('payment_type, payment_nakit, payment_eft, payment_kredi')
    .eq('meet_id', meetId)
    .eq('name', name)
    .eq('user_type', 'T')
    .order('deleted_at', { ascending: false }) // en son silinen
    .limit(1);

  if (error || !data?.length) return null;
  return data[0];
}

// 🔹 Ödeme kaydı
async function submitPayment() {
  if (!selectedCustomer.value ||!meetId) {
    console.warn('❌ Müşteri veya toplantı ID eksik.');
    return;
}

  const selected = customerList.value.find(c => c.email === selectedCustomer.value);
  const customerName = selected?.name || 'Bilinmeyen';

  const expectedTotal = parseFloat((totalAmount.value + rate.value).toFixed(2));
  let totalPaid = expectedTotal;

  if (isSplitPayment.value) {
  totalPaid = parseFloat(
    (payment_nakit.value + payment_eft.value + payment_kredi.value).toFixed(2)
);
  const difference = Math.abs(expectedTotal - totalPaid);

  if (difference> 0.01) {
    alert(`⚠️ Ödenen toplam (${totalPaid}₺), beklenen tutar (${expectedTotal}₺) ile uyuşmuyor.`);
   return;
}
}

  let paymentData = {
  meet_id: meetId,
  name: customerName,
  payment: totalPaid,
  rate: rate.value,
  payment_type: isSplitPayment.value? 'parçalı': paymentType.value,
  payment_nakit: payment_nakit.value,
  payment_eft: payment_eft.value,
  payment_kredi: payment_kredi.value,
  user_type: 'T'
};

  if (isSplitPayment.value) {
  const totalPaid = parseFloat(
    (payment_nakit.value + payment_eft.value + payment_kredi.value).toFixed(2)
);
  const difference = Math.abs(expectedTotal - totalPaid);

  if (difference> 0.01) {
    alert(`⚠️ Ödenen toplam (${totalPaid}₺), beklenen tutar (${expectedTotal}₺) ile uyuşmuyor.`);
   return;
}

  paymentData.payment_nakit = payment_nakit.value;
  paymentData.payment_eft = payment_eft.value;
  paymentData.payment_kredi = payment_kredi.value;
} else {
  paymentData[`payment_${paymentType.value}`] = expectedTotal;
}

  const success = await recordPayment(paymentData);



  if (success) {
    alert('💳 Ödeme başarıyla kaydedildi!');
    await fetchCustomers();
    orders.value = [];
    selectedCustomer.value = '';
    payment_nakit.value = 0;
    payment_eft.value = 0;
    payment_kredi.value = 0;
    isSplitPayment.value = false;
}
}

// 🔹 Oranı yeniden hesapla
async function recalculateRate() {
  rate.value = await fetchRateForAmount(totalAmount.value);
}

// 🔹 Ürünleri çek
async function fetchProducts() {
  const { data} = await supabase
.from(`products_${companyName}`)
.select('id, name, unit, price, supplier_id');

  productList.value = data?? [];
}

// 🔹 Yeni sipariş ekle
async function fetchSuppliers() {
  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name, isActive, name')
.eq('isActive', true)
.order('id', { ascending: true});

  if (error) {
    console.error('❌ Üretici listesi alınamadı:', error.message);
    supplierList.value = [];
    return;
}

  supplierList.value = data?? [];
}


async function fetchProductsBySupplier() {
  if (!selectedSupplierId.value) return;

  const { data, error} = await supabase
.from(`products_${companyName}`)
.select('id, name, unit, price, supplier_id, isActive')
.eq('supplier_id', selectedSupplierId.value)
.eq('isActive', true)
.order('name', { ascending: true});

  if (error) {
    console.error('❌ Ürün listesi alınamadı:', error.message);
    filteredProducts.value = [];
    return;
}

  filteredProducts.value = data?? [];
}

async function addOrderItem() {
  if (!selectedProductId.value || newQuantity.value <= 0) {
    alert('Lütfen geçerli ürün ve miktar girin.');
    return;
}

  const product = productList.value.find(p => p.id === selectedProductId.value);
  if (!product) {
    alert('Ürün bulunamadı.');
    return;
}

  const { error} = await supabase
.from(`order_items_${companyName}`)
.upsert([
      {
        user_mail: selectedCustomer.value,
        meet_id: meetId,
        product_id: product.id,
        supplier_id: product.supplier_id,
        name: product.name,
        price: product.price,
        quantity: newQuantity.value,
        description: newDescription.value
}
    ]);

  if (error) {
    console.error('❌ Sipariş ekleme hatası:', error.message);
} else {
    alert('✅ Sipariş eklendi!');

    await fetchOrders(); // listeyi güncelle
    selectedProductId.value = '';
    newQuantity.value = 1;
    newDescription.value = '';
}
}

// 🔹 Sayfa yüklendiğinde müşteri listesini getir
onMounted(() => {
  fetchCustomers(); // ✅ Türeticileri çek
  fetchSuppliers(); // ✅ üreticileri çek
  fetchProducts(); // ✅ ürünleri de çek
});

// 🔁 Müşteri seçimi değiştiğinde arşiv kontrolü
watch(selectedCustomer, async (email) => {
  // 🔄 Önce alanları sıfırla
  paymentType.value = 'nakit';
  payment_nakit.value = 0;
  payment_eft.value = 0;
  payment_kredi.value = 0;
  isSplitPayment.value = false;

  const customer = customerList.value.find(c => c.email === email);
  if (!customer) return;

  const archived = await fetchArchivedPaymentInfo(customer.name);
  if (!archived) return;

  // 🔁 Arşivden gelen verileri uygula
  paymentType.value = archived.payment_type;
  payment_nakit.value = archived.payment_nakit;
  payment_eft.value = archived.payment_eft;
  payment_kredi.value = archived.payment_kredi;
  isSplitPayment.value = archived.payment_type === 'parçalı';
});

</script>


<style scoped>
.success {
  background-color: #4caf50;
  color: white;
}

.kasa-entry {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}
table {
  width: 100%;
  border-collapse: collapse;
}
td, th {
  padding: 8px;
  border-bottom: 1px solid #ccc;
  text-align: left;
}
th:last-child,
td:last-child {
  text-align: right;
}
input[type="number"] {
  width: 60px;
}
.new-order-box {
  border: 1px solid #ccc;
  padding: 16px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
}
</style>
