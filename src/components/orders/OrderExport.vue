<template>
  <div class="order-pdf-section">
    <h2>Sipariş Özeti</h2>

    <div ref="pdfContent" class="table-container">
      <table class="export-table">
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

    <button class="pdf-button" @click="generatePDF">📄 PDF Olarak Kaydet</button>
  </div>
</template>


<script setup>
import { ref, onMounted, computed} from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';

// 📦 PDF içeriği referansı
const pdfContent = ref(null);
const orders = ref([]);

const rate = ref(0);

// 🌐 Oturum bilgileri
const userName = localStorage.getItem('userName') || '';
const userMail = localStorage.getItem('userEmail') || '';
const meetId = localStorage.getItem('meetId') || '';
const weekId = localStorage.getItem('weekId') || '';
const companyName = localStorage.getItem('companyName') || '';

// 💰 Toplam tutar
const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 🚀 Sayfa yüklenince sipariş verisini getir
onMounted(async () => {
  await fetchOrders();
  rate.value = await fetchRateForAmount(totalAmount.value); 
});

// 📥 Sipariş verisini ve üretici eşlemesini al
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
    return;
}

  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name');

  if (supplierError ||!supplierData) {
    console.error('❌ Tedarikçi alınamadı:', supplierError);
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
}

// 🧾 PDF üret
async function generatePDF() {
  const element = pdfContent.value;
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2});
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 10, pageWidth, pageHeight);
  pdf.save(`${meetId}-hafta${weekId}-${userName}-siparisleri.pdf`);
}
</script>


<style scoped>
.order-pdf-section {
  padding: 20px;
}
.table-container {
  margin: 16px 0;
  overflow-x: auto;
}
.export-table {
  width: 100%;
  border-collapse: collapse;
}
.export-table th,.export-table td {
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 14px;
  text-align: left;
}
.pdf-button {
  margin-top: 12px;
  padding: 8px 16px;
  font-size: 15px;
  background: #007bff;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.pdf-button:hover {
  background: #0056b3;
}

td:nth-child(3),   
td:nth-child(4),  
td:nth-child(5) {
  text-align: right;
}

</style>
