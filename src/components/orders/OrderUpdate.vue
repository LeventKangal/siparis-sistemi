<template>
  <div class="order-summary">
    <h2>Sipariş Güncelleme</h2>

    <div v-if="orders.length">
      <table class="siparis-tablosu">
        <thead>
          <tr>
            <th>Üretici</th>
            <th>Ürün Adı</th>
            <th style="text-align: right;">Fiyat</th>
            <th style="text-align: center;">Miktar</th>
            <th style="text-align: right;">Tutar</th>
            <th style="text-align: center;">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders":key="order.product_id">
            <td>{{ supplierMap[order.supplier_id] || 'Tanımsız Üretici'}}</td>
            <td>{{ order.product_name?.substring(0, 30)}}</td>
            <td style="text-align: right;">{{ formatPrice(order.price)}} ₺</td>
            <td>
              <input
                type="number"
                v-model.number="order.newQuantity"
:disabled="order.disableQuantity"
                @input="checkZero(order)"
                min="0.01"
                step="0.01"
                inputmode="decimal"
                class="quantity-input"
              />
              <p v-if="order.warningMessage" class="warning">{{ order.warningMessage}}</p>
            </td>
            <td style="text-align: right;">
              {{ formatPrice(order.newQuantity * order.price)}} ₺
            </td>
            <td>
              <button
                class="update-btn"
                @click="updateQuantity(order)"
:disabled="order.disableQuantity"
>
                💾 Güncelle
              </button>
              <span v-if="order.disableQuantity" class="disable-reason">
    ⛔ Bu Ürün Güncelleme işlemine kapalı.
  </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <p>Henüz siparişiniz bulunmamaktadır.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';
import { updateStock} from '@/services/orderService';
import { formatPrice} from '@/utils/formatters';

const userMail = ref(localStorage.getItem('userEmail') || '');
const meetId = ref(localStorage.getItem('meetId') || '');
const companyName = localStorage.getItem('companyName') || '';
const currentUserName = localStorage.getItem('userName') || '';

const orders = ref([]);
const suppliers = ref([]);
const disabledSuppliers = ref([]);

const supplierMap = computed(() =>
  Object.fromEntries(suppliers.value.map(s => [s.id, s.supplier_name]))
);

const checkZero = async (order) => {
  let input = order.newQuantity?.toString().trim() || '';
  if (input.includes(',')) input = input.replaceAll(',', '.');
  order.newQuantity = parseFloat(input);

  const parsed = parseFloat(order.newQuantity);
  if (isNaN(parsed)) {
    order.warningMessage = 'Geçersiz sayı girdiniz.';
    setTimeout(() => (order.warningMessage = ''), 4000);
    return;
}

  if (parsed === 0) {
    order.warningMessage = 'Sıfır girilemez. İptal menüsünden iptal edin.';
    setTimeout(() => (order.warningMessage = ''), 4000);
    await logError(order, 'Sıfır girilemez. İptal menüsünden iptal edin.', order.previousQuantity, order.catalog_id);
    order.newQuantity = order.previousQuantity;
    return;
}

  order.warningMessage = '';
};

onMounted(async () => {
  await Promise.all([fetchSuppliers(), fetchResetLogs()]);
  await fetchOrders();
});

async function fetchSuppliers() {
  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name');

  if (!error && data) suppliers.value = data;
  else console.error('❌ Üretici verisi alınamadı:', error);
}

async function fetchResetLogs() {
  const { data, error} = await supabase
.from('reset_logs')
.select('supplier_id')
.eq('company_name', companyName)
.eq('status', 'success');

  if (!error && data) {
    disabledSuppliers.value = data.map(item => String(item.supplier_id));
} else {
    console.error('❌ Reset logları alınamadı:', error);
}

}

async function fetchOrders() {
  const userType = localStorage.getItem('userType') || 'T';
  const userEmail = userMail.value;

  let query = supabase
.from(`order_items_${companyName}`)
.select('supplier_id, product_id, name, description, quantity, price, user_mail')
.eq('meet_id', meetId.value);

  if (userType === 'T') query = query.eq('user_mail', userEmail);

  const { data, error} = await query;

  if (!error && data?.length) {
    orders.value = await Promise.all(data.map(async order => {
      const { data: productData} = await supabase
.from(`products_${companyName}`)
.select('stock')
.eq('id', order.product_id)
.single();

      const disable = productData?.stock === 0 && disabledSuppliers.value.includes(String(order.supplier_id));

      return {
...order,
        product_name: order.name,
        newQuantity: order.quantity,
        warningMessage: '',
        disableQuantity: disable
};
}));
} else {
    console.warn('📭 Sipariş verisi boş ya da hata oluştu:', error);
    orders.value = [];
}
}

async function updateQuantity(orderItem) {
  if (orderItem.disableQuantity) {
    alert('Bu ürün için miktar güncellenemez.');
    return;
}

  const miktar = parseFloat(orderItem.newQuantity);
  const eski = parseFloat(orderItem.quantity);

  if (orderItem.previousQuantity === undefined) {
    orderItem.previousQuantity = orderItem.quantity;
}
const { data: productData, error: productError} = await supabase
.from(`products_${companyName}`)
.select('stock, min_quantity, max_quantity, catalog_id, name')
.eq('id', orderItem.product_id)
.single();

  if (productError ||!productData) {
    alert('❌ Ürün verisi alınamadı.');
    return;
}

  const { stock, min_quantity, max_quantity, catalog_id} = productData;
  const min = min_quantity?? 0;
  const max = max_quantity?? Infinity;
  const fark = miktar - eski;

  if (miktar < min || (min === 1 &&!Number.isInteger(miktar))) {
    alert(`📦 "${orderItem.product_name}" için en az ${min} adet ve tam sayı girmelisiniz.`);
    orderItem.newQuantity = orderItem.previousQuantity;
    return;
}

  if (miktar> max) {
    alert(`📦 "${orderItem.product_name}" için en fazla ${max} adet girebilirsiniz.`);
    orderItem.newQuantity = orderItem.previousQuantity;
    return;
}

  if (fark> stock) {
    alert(`🚫 Yetersiz stok: "${orderItem.product_name}" için sadece ${stock} adet mevcut.`);
    orderItem.newQuantity = orderItem.previousQuantity;
    return;
}

  try {
    const { error} = await supabase
.from(`order_items_${companyName}`)
.update({ quantity: miktar})
.match({
        user_mail: userMail.value,
        meet_id: meetId.value,
        product_id: orderItem.product_id,
        supplier_id: orderItem.supplier_id
});

    if (!error) {
      await updateStock([{ product_id: orderItem.product_id, quantity: fark}], companyName, false);
      orderItem.quantity = miktar;
      alert('✅ Sipariş başarıyla güncellendi.');
      await fetchOrders();

      await logError(orderItem, 'Güncelleme başarılı', eski, catalog_id);
} else {
      throw error;
}
} catch (err) {
    console.error('❌ Güncelleme hatası:', err);
    alert('Sipariş güncellenemedi: ' + (err.message?? 'Bilinmeyen hata'));
}
}

async function logError(orderItem, message, oldQuantity, catalogId) {
  await supabase
.from('order_logs')
.insert([{
      company_name: companyName,
      user_mail: currentUserName,
      meet_id: meetId.value,
      supplier_id: supplierMap.value[orderItem.supplier_id] || '—',
      product_id: orderItem.name,
      action: 'update',
      details: {
        user_name: currentUserName,
        supplier_id: orderItem.supplier_id,
        catalog_id: catalogId,
        quantity: orderItem.newQuantity,
        oldquantity: oldQuantity,
        error: message
}
}]);
}
</script>



<style scoped>
.quantity-input {
  text-align: center;
  width: 80px;
  padding: 5px;
  font-size: 14px;
}
.order-summary {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}
.siparis-tablosu th,
.siparis-tablosu td {
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 14px;
  text-align: left;
 }
 .disable-reason {
  margin-left: 8px;
  font-size: 0.85em;
  color: #0a0a0a;
}
</style>
