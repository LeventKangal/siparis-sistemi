<template>
  <div class="order-summary">
    <h2>Sipariş Görüntüleme</h2>

    <div v-if="orders.length">
      <div class="table-wrapper">
        <table class="siparis-tablosu">
          <thead>
            <tr>
              <th style="width: 50px;">Üretici</th>
              <th style="width: 50px;">Ürün Adı</th>
              <th style="text-align: left;">Birim</th>
              <th style="text-align: right;">Fiyat</th>
              <th style="text-align: right;">Miktar</th>
              <th style="text-align: right;">Toplam</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders":key="order.product_id">
            <td>{{(order.suppliers?.supplier_name || order.supplier_name || 'Tanımsız Üretici').substring(0, 15)}}</td>
            <td style="width: 220px; text-align: left;">{{ order.product_name?.substring(0, 25)}}</td>
            <td style="text-align: left;">{{ order.unit?.substring(0, 15)}}</td>
            <td style="width: 80px; text-align: right;">{{ formatPrice(order.price)}} ₺</td>
            <td style="width: 50px; text-align: right;">{{ formatPrice(order.quantity)}}</td>
            <td style="width: 50px; text-align: right;">{{ formatPrice(order.quantity * order.price)}} ₺</td>
          </tr>
            <tr>
             <td colspan="4"></td>
             <td style="text-align: right; width: 50px; font-weight: bold;">Ara Toplam</td>
             <td style="text-align: right; width: 50px; font-weight: bold;">{{ formatPrice(totalAmount)}} ₺</td>
            </tr>
             <tr>
             <td colspan="4"></td>
             <td style="text-align: right; width: 50px; font-weight: bold;">Kasa Payı</td>
             <td style="text-align: right; width: 50px; font-weight: bold;">{{ formatPrice(rate)}} ₺</td>
            </tr>
            <tr>
             <td colspan="4"></td>
             <td style="text-align: right; width: 90px; font-weight: bold;">Genel Toplam</td>
             <td style="text-align: right; width: 90px; font-weight: bold;">{{ formatPrice(totalAmount + rate)}} ₺</td>
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

// 📦 Siparişler ve oran
const orders = ref([]);
const rate = ref(0);

const totalAmount = computed(() => {
  return orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// 🌐 Oturum verileri
const userMail = localStorage.getItem('userEmail') || '';
const meetId = localStorage.getItem('meetId') || '';
const companyName = localStorage.getItem('companyName') || '';

// 💰 Sayfa yüklendiğinde veri çek
onMounted(async () => {
  await fetchOrders();
});

// 📥 Siparişleri ve üreticileri eşleştirerek çek ve oranı hesapla
async function fetchOrders() {
  const { data: orderData, error: orderError} = await supabase
.from(`order_items_${companyName}`)
.select(`
    supplier_id,
    product_id,
    name,
    description,
    quantity,
    price,
    products:product_id (
      unit
)
  `)
.eq('user_mail', userMail)
.eq('meet_id', meetId)
.order('supplier_id', { ascending: true});

  if (orderError ||!orderData) {
    console.error('❌ Sipariş alınamadı:', orderError);
    orders.value = [];
    rate.value = 0;
    return;
}

  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name');

  if (supplierError ||!supplierData) {
    console.error('❌ Tedarikçi alınamadı:', supplierError);
    rate.value = 0;
    return;
}

  const supplierMap = {};
  supplierData.forEach(s => {
    supplierMap[s.id] = s.supplier_name;
});

  // Siparişleri eşleştir
  orders.value = orderData.map(order => ({
...order,
    product_name: order.name,
    supplier_name: supplierMap[order.supplier_id] || '❓ Tanımsız Üretici',
    unit: order.products?.unit || '' // ürün birimi
}));

  // 💰 Toplam tutarı hesapla ve oranı al
 // const amount = orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
  //console.log('💰 Toplam tutar:', amount);

  const rateResponse = await fetchRateForAmount(totalAmount.value);
  if (rate.value === 0) {
  console.warn('⚠️ Oran hesaplanamadı veya sıfır döndü.')
}

  rate.value = rateResponse || 0;
  //console.log('📈 Gelen oran:', rate.value);
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
  border-collapse: collapse;
}

.siparis-tablosu th,
.siparis-tablosu td {
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 14px;
  text-align: left;
}
td:nth-child(3),
td:nth-child(4),
td:nth-child(5) {
  text-align: right;
}


</style>
