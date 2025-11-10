<template>
  <div class="summary-container">
    <h2>📋 Sipariş Özeti Paneli</h2>

    <div class="columns">
      <!-- 🔹 Tüketiciler -->
      <div class="column">
        <h3>🧾 Tüketici Girişleri</h3>
        <ul>
          <li v-for="entry in consumerEntries":key="entry.name">
            {{ entry.name}} → {{ formatPrice(entry.payment)}} ₺
          </li>
        </ul>
      </div>

      <!-- 🔹 Üreticiler -->
      <div class="column">
        <h3>🌾 Üretici Çıkışları</h3>
        <ul>
          <li v-for="entry in supplierEntries":key="entry.name">
            {{ entry.name}} → {{ formatPrice(entry.payment)}} ₺
          </li>
        </ul>
      </div>
    </div>

    <!-- 🔍 Genel Toplamlar -->
    <div class="totals">
      <p><strong>🧾 Tüketici Toplamı:</strong> {{ formatPrice(totalCustomerAmount)}} ₺</p>
      <p><strong>🌾 Üretici Toplamı:</strong> {{ formatPrice(totalSupplierAmount)}} ₺</p>
      <p><strong>🗄️ Toplam Kasa Payı:</strong> {{ formatPrice(totalRateAmount)}} ₺</p>
      <p><strong>🏦 Toplam Gider:</strong> {{formatPrice(totalPayment)}} ₺</p>
      <p><strong>💰 Kasa Nakit (+-) :</strong> {{formatPrice(totalLeft)}} ₺</p>

      <p v-if="mismatch" style="color: red;">⚠️ Toplamlar eşleşmiyor!</p>
      <p v-else style="color: green;">✅ Toplamlar örtüşüyor.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';

const companyName = localStorage.getItem('companyName') || '';
const meetId = localStorage.getItem('meetId') || '';

const rawOrders = ref([]);

// 📥 Tüm ödeme kayıtlarını al
async function fetchOrders() {
  const { data, error} = await supabase
.from(`orders_${companyName}`)
.select('name, payment, rate')
.eq('meet_id', meetId)
.eq('isChecked', true)
.order('name', { ascending: true});

  if (error ||!data) {
    console.error('❌ Sipariş verileri alınamadı:', error);
    rawOrders.value = [];
    return;
}

  rawOrders.value = data;
}

// 🔹 Tüketici girişleri (rate varsa)
const consumerEntries = computed(() =>
  rawOrders.value.filter(r => r.rate!== null)
);

// 🔹 Üretici çıkışları (rate yok)
const supplierEntries = computed(() =>
  rawOrders.value.filter(r => r.rate === null)
);

// 🔢 Toplamlar
const totalCustomerAmount = computed(() =>
  consumerEntries.value.reduce((sum, r) => sum + r.payment, 0)
);

const totalSupplierAmount = computed(() =>
  supplierEntries.value.reduce((sum, r) => sum + r.payment, 0)
);

const totalRateAmount = computed(() =>
  consumerEntries.value.reduce((sum, r) => sum + (r.rate || 0), 0)
);

const totalPayment = computed(() =>
  totalSupplierAmount.value + totalRateAmount.value
);

const totalLeft = computed(() =>
  totalCustomerAmount.value - totalPayment.value
);


//const mismatch = computed(() => totalCustomerAmount.value!== totalSupplierAmount.value);

// 📦 Sayfa yüklendiğinde verileri getir
onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.summary-container {
  padding: 20px;
}
.columns {
  display: flex;
  gap: 60px;
  align-items: flex-start;
  flex-wrap: nowrap;
}
.column {
  flex: 1;
  min-width: 260px;
  background-color: #f7f7f7;
  border-radius: 6px;
  padding: 12px;
}
ul {
  list-style: none;
  padding-left: 0;
}
li {
  padding: 4px 0;
  font-size: 14px;
}
.totals {
  margin-top: 30px;
  text-align: right;
}
</style>
