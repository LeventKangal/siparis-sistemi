<template>
  <div class="order-summary">
    <h2>Üretici Sipariş Görüntüleme</h2>

    <div v-if="orders.length">
      <div class="table-wrapper">
        <table class="siparis-tablosu">
          <thead>
            <tr>
              <th style="width: 80px;">Üretici</th>
              <th>Ürün Adı</th>
              <th style="text-align: right;">Fiyat</th>
              <th style="text-align: right;">Miktar</th>
              <th style="text-align: right;">Toplam</th>
              <th>Türetici</th>
              <th>Giriş Sırası</th>
              <th>Saat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in ordersWithCumulativeQuantity":key="order.product_id + '-' + order.created_at">
  <td>{{ order.supplier_name || 'Tanımsız'}}</td>
  <td>{{ order.product_name?.substring(0, 30)}}</td>
  <td>{{ formatPrice(order.price)}} ₺</td>
  <td>{{ formatPrice(order.quantity)}}</td>
  <td>{{ formatPrice(order.quantity * order.price)}} ₺</td>
  <td>{{ order.user_name}}</td>
  <td style="text-align: center;">
    <strong style="color: #555;">{{ formatPrice(order.cumulative_quantity)}}</strong> </td>
    <td>
    <small style="color: gray;">{{ formatDateTime(order.created_at)}}</small><br />
    </td>

</tr>


          </tbody>
        </table>
      </div>
    </div>

    <div v-else>
      <p>Henüz siparişiniz bulunmamaktadır.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';
import { computed} from 'vue';


const userMail = ref((localStorage.getItem('userEmail') || ''));
const meetId = ref(localStorage.getItem('meetId'));

console.log('userMail:', userMail);
console.log('meetId:', meetId);

const orders = ref([]);
const rate = ref(0);
const totalAmount = ref(0);

const ordersWithCumulativeQuantity = computed(() => {
  const productTotals = {}; // ürün bazlı sayaç
  return orders.value.map(order => {
    const productId = order.product_id;

    if (!productTotals[productId]) {
      productTotals[productId] = 0;
}

    productTotals[productId] += order.quantity;

    return {
...order,
      cumulative_quantity: productTotals[productId]
};
});
});


onMounted(async () => {
  await fetchOrders(); // siparişleri al
  rate.value = await fetchRateForAmount(totalAmount.value); // oranı al
});

async function fetchOrders() {
  const userType = localStorage.getItem('userType');
  const companyName = localStorage.getItem('companyName')?.trim() || '';


  // 👥 Üreticileri al
  const { data: allSuppliers} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name, email');

  // 👥 Kullanıcıları al
  const { data: allUsers} = await supabase
.from(`users_${companyName}`)
.select('email, name');

  // 👥 Haritalama: email → name
  const userMap = Object.fromEntries(
    allUsers.map(user => [user.email, user.name])
);

  const supplier = allSuppliers?.find(s => s.email === userMail.value);
  const allowedSupplierId = supplier?.id;

  const { data: allOrders, error} = await supabase
.from(`order_items_${companyName}`)
.select('supplier_id, product_id, name, description, quantity, price, user_mail, created_at')
.eq('meet_id', meetId.value)
.eq('supplier_id', allowedSupplierId)
.order('supplier_id', { ascending: true})
.order('product_id', { ascending: true})
.order('created_at', { ascending: true});

  if (error) {
    console.error('Siparişleri yüklerken hata:', error);
    return;
}

  let filteredOrders = allOrders || [];

if (userType === 'U' && allowedSupplierId) {
  filteredOrders = filteredOrders.filter(order => order.supplier_id === allowedSupplierId);
}

const supplierMap = Object.fromEntries(
  allSuppliers.map(s => [s.id, s.supplier_name])
);

totalAmount.value = filteredOrders.reduce((sum, o) => sum + o.price * o.quantity, 0);

orders.value = filteredOrders.map(order => ({
  ...order,
  product_name: order.name,
  supplier_name: supplierMap[order.supplier_id] || 'Bilinmeyen Üretici',
  user_name: userMap[order.user_mail] || 'Tanımsız Kullanıcı'
}));

}



function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
}).format(date);
}



</script>

<style scoped>
.order-summary {
  padding: 20px;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.siparis-tablosu {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}

.siparis-tablosu th,
.siparis-tablosu td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
td:nth-child(3),
td:nth-child(4),
td:nth-child(5) {
  width:100px;
  text-align: right;
}
th:nth-child(3),
th:nth-child(4),
th:nth-child(5) {
  width: 100px;
  text-align: right;
}

</style>
