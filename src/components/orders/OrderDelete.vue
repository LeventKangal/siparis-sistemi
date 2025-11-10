<template>
  <div class="order-summary">
    <h2>Sipariş Silme</h2>

    <div v-if="orders.length">
      <table class="siparis-tablosu">
        <thead>
          <tr>
            <th style="width: 50px;">Üretici</th>
            <th style="width: 50px;">Ürün Adı</th>
            <th style="text-align: right;">Fiyat</th>
            <th style="text-align: center;">Miktar</th>
            <th style="text-align: center;">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders":key="order.product_id">
            <td>{{ supplierMap[order.supplier_id] || '❓ Tanımsız Üretici'}}</td>
            <td style="width: 180px; text-align: left;">{{ order.product_name}}</td>
            <td style="width: 80px; text-align: right;">{{ formatPrice(order.price)}} ₺</td>
            <td style="width: 50px; text-align: center;">{{ order.quantity}}</td>
            <td>
  <button
    class="delete-btn"
    @click="deleteOrderItem(order)"
:disabled="order.disableDelete"
:title="order.disableDelete? 'Bu Ürün Silme işlemine kapalı.': ''"
>
    🗑️ Sil
  </button>

  <span v-if="order.disableDelete" class="disable-reason">
    ⛔ Bu Ürün Silme işlemine kapalı.
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


// Kapalı ürünleri getir
async function fetchResetLogs() {
  const { data, error} = await supabase
.from('reset_logs')
.select('supplier_id')
.eq('company_name', companyName)
.eq('status', 'success');

  if (!error && data) {
    disabledSuppliers.value = data.map(item => Number(item.supplier_id));
} else {
    console.error('❌ Reset logları alınamadı:', error);
}
}

onMounted(async () => {
  await Promise.all([fetchSuppliers(), fetchResetLogs()]);
  await fetchOrders();
});

async function fetchSuppliers() {
  const { data, error} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name');

  if (!error && data) {
    suppliers.value = data;
} else {
    console.error('❌ Üretici verisi alınamadı:', error);
}
}

async function fetchOrders() {
  const userType = localStorage.getItem('userType') || 'T';
  const userEmail = localStorage.getItem('userEmail') || '';

  let query = supabase
.from(`order_items_${companyName}`)
.select('supplier_id, product_id, name, description, quantity, price, user_mail')
.eq('meet_id', meetId.value);

  // 🔐 Eğer kullanıcı tipi "T" ise sadece kendi siparişleri gelsin
  if (userType === 'T') {
    query = query.eq('user_mail', userEmail);
}

  const { data, error} = await query;

  if (!error && data?.length) {
  orders.value = await Promise.all(data.map(async order => {
      const { data: productData} = await supabase
.from(`products_${companyName}`)
.select('stock')
.eq('id', order.product_id)
.single();

      const disable = productData?.stock === 0 && disabledSuppliers.value.includes(order.supplier_id);

      return {
...order,
        product_name: order.name,
        newQuantity: order.quantity,
        disableDelete: disable
};
}));



} else {
    console.warn('📭 Sipariş verisi boş ya da hata oluştu:', error);
    orders.value = [];
}
}

const supplierMap = computed(() =>
  Object.fromEntries(suppliers.value.map(s => [s.id, s.supplier_name]))
);

async function deleteOrderItem(orderItem) {
  const { error} = await supabase
.from(`order_items_${companyName}`)
.delete()
.match({
      user_mail: userMail.value,
      meet_id: meetId.value,
      product_id: orderItem.product_id,
      supplier_id: orderItem.supplier_id
});
if (!error) {
  console.log('✅ Sipariş kaydı veritabanından silindi.');

  await updateStock(
  [{ product_id: orderItem.product_id, quantity: orderItem.quantity }],
  companyName,
  true
);

  orders.value = orders.value.filter(o =>
  !(o.product_id === orderItem.product_id && o.supplier_id === orderItem.supplier_id));

  alert('✅ Sipariş silindi ve stok geri yüklendi.');
  await logError(orderItem, 'Silme başarılı');
} else {
  console.error('❌ Silme hatası:', error);
  alert('Sipariş silinemedi: ' + error.message);
}
}

// 📋 Silme loglama
async function logError(orderItem, message) {
  await supabase
    .from('order_logs')
    .insert([{
      company_name: companyName,
      user_mail: currentUserName,
      meet_id: meetId.value,
      supplier_id: supplierMap.value[orderItem.supplier_id] || '—',
      product_id: orderItem.name,
      action: 'delete',
      details: {
        user_name: currentUserName,
        supplier_id: supplierMap.value[orderItem.supplier_id] || '—',
        quantity: orderItem.newQuantity,
        error: message
      }
    }])
}
</script>


<style scoped>
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
  color: #0f0f0f;
}
</style>
