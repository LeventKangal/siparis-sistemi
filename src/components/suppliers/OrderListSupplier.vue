<template>
  <div class="order-summary">
    <h2>Sipariş Miktar Güncelleme</h2>

    <div v-if="orders.length">
      <div class="table-wrapper">
        <table class="siparis-tablosu">
          <thead>
            <tr>
            <!--  <th style="text-align: left;">Üretici</th>-->
              <th style="text-align: left;">Ürün Adı</th>
              <th style="text-align: left;">Birim</th>
              <th style="text-align: right;">Fiyat</th>
              <th style="text-align: right;">Miktar</th>
              <th style="text-align: right;">Toplam</th>
              <th style="text-align: left;">Türetici</th>
              <th style="text-align: center;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.product_id">
            <!--  <td>{{ order.supplier_name || 'Tanımsız'}}</td>-->
              <td style="text-align: left;">{{ order.product_name?.substring(0, 25)}}</td>

              <td style="text-align: left;"> {{ order.unit?.substring(0, 15)}} </td>

              <td>
                <template v-if="userType === 'A'">
                  <input
                   type="number"
                   v-model.number= "order.price"
                   style="text-align: right;"
                   />
               </template>
                <template v-else>
                {{ formatPrice(order.price)}} ₺
                </template>
              </td>

               <td style="text-align: right;">
                 <input
                  type="number"
                  v-model.number="order.quantity"
                  min="0"
                 style="width: 45px; text-align: right; padding: 2px; font-size: 0.85rem;" />
              </td>
              <td style="text-align: right;">{{ formatPrice(order.quantity * order.price)}} ₺</td>
              <td style="text-align: left;">{{ order.user_name || 'Tanımsız'}}</td>
              <td>
                <button @click="updateQuantity(order)">Miktar Güncelle</button>
              </td>
              <td>
                <button v-if="userType === 'A'" @click="updatePrice(order)">Fiyat Güncelle</button>
              </td>
            </tr>
            <tr>
              <td colspan="5"></td>

              <td style="text-align: right; font-weight: bold; width: 60px; ">{{ formatPrice(totalAmount)}} ₺</td>
              <td style="text-align: left; font-weight: bold; width: 60px;">Toplam TL</td>
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
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';

const userMail = ref(localStorage.getItem('userEmail') || '');
const meetId = ref(localStorage.getItem('meetId'));
const companyName = ref(localStorage.getItem('companyName')?.trim() || '');
const userType = ref(localStorage.getItem('userType'));

const orders = ref([]);
const rate = ref(0);
const userMap = ref({});

const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

onMounted(async () => {
  await fetchOrders();
  rate.value = await fetchRateForAmount(totalAmount.value);
});

async function fetchOrders() {

 const { data: allSuppliers} = await supabase
.from(`suppliers_${companyName.value}`)
.select('id, supplier_name, email');

  const { data: allUsers} = await supabase
.from(`users_${companyName.value}`)
.select('email, name');

  userMap.value = Object.fromEntries(
    allUsers.map(user => [user.email, user.name])
);

  const supplier = allSuppliers?.find(s => s.email === userMail.value);
  const allowedSupplierId = supplier?.id;


let query = supabase
.from(`order_items_${companyName.value}`)
.select(`
    supplier_id,
    product_id,
    user_mail,
    name,
    description,
    quantity,
    price,
    products:product_id (
      unit
)
  `)
.eq('meet_id', meetId.value);

if (userType.value === 'A') {
  query = query
.order('supplier_id', { ascending: true})
.order('product_id', { ascending: true});
} else {
  query = query
.order('user_mail', { ascending: true})
.order('product_id', { ascending: true});
}

const { data: allOrders, error} = await query;

  if (error) {
    console.error('Siparişleri yüklerken hata:', error);
    return;
}

  let filteredOrders = allOrders || [];
  if (userType.value === 'U' && allowedSupplierId) {
    filteredOrders = filteredOrders.filter(order => order.supplier_id === allowedSupplierId);
}

  const supplierMap = Object.fromEntries(
    allSuppliers.map(s => [s.id, s.supplier_name])
);
orders.value = filteredOrders.map(order => ({
...order,
    product_name: order.name,
    supplier_name: supplierMap[order.supplier_id] || 'Bilinmeyen Üretici',
    user_name: userMap.value[order.user_mail] || 'Tanımsız Kullanıcı',
    unit: order.products?.unit || '' // ürün birimi

}));
}

const updateQuantity = async (order) => {
  const { error} = await supabase
.from(`order_items_${companyName.value}`)
.update({ quantity: order.quantity})
.eq('product_id', order.product_id)
.eq('meet_id', meetId.value)
.eq('user_mail', order.user_mail);

  if (error) {
    console.error('Miktar güncellenemedi:', error.message);
} else {
    console.log('Miktar güncellendi');
    await fetchOrders() ;
}
};

const updatePrice = async (order) => {
  const { error} = await supabase
.from(`order_items_${companyName.value}`)
.update({ price: order.price})
.eq('product_id', order.product_id)
.eq('meet_id', meetId.value)
.eq('user_mail', order.user_mail);

  if (error) {
    console.error('Fiyat güncellenemedi:', error.message);
} else {
    console.log('Fiyat güncellendi');
    await fetchOrders() ;

}
};
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


.order-summary {
  padding: 20px;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.siparis-tablosu {
  width: 100%;
  border-collapse: collapse;
}

.siparis-tablosu th,
.siparis-tablosu td {
  border: 1px solid #ccc;
  padding: 4px;
  font-size: 14px;
  text-align: left;
}

td:nth-child(1),
th:nth-child(1) {
  width: 220px;
  text-align: left;
}

td:nth-child(2),
th:nth-child(2) {
  width: 120px;
  text-align: left;
}

td:nth-child(3),
th:nth-child(3) {
  width:90px;
  text-align: right;
}

td:nth-child(4),
th:nth-child(4) {
  width: 40px;
  text-align: right;
}

td:nth-child(5),
th:nth-child(5) {
  width: 90px;
  text-align: right;
}
td:nth-child(6),
th:nth-child(6) {
  width: 160px;
  text-align: left;
}
td:nth-child(7),
th:nth-child(7) {
  width: 120px;
  text-align: left;
}

</style>
