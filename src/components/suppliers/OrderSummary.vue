<template>
  <div class="order-summary">
    <h2>Toplu Sipariş Özeti</h2>

    <table>
      <thead>
        <tr>
          <th>Ürün</th>
          <th>Fiyat</th>
          <th>Toplam Miktar</th>
          <th>Toplam Tutar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in groupedSummary" :key="item.product_id">
          <td>{{ item.product_name}}</td>
          <td>{{ formatPrice(item.price)}} ₺</td>
          <td>{{ formatPrice(item.total_quantity)}}</td>
          <td>{{ formatPrice(item.total_amount)}} ₺</td>
        </tr>
      </tbody>
    </table>
    <div class="grand-total">
  <strong>Genel Toplam:</strong> {{ formatPrice(totalAmount)}} ₺
    </div>

    <button @click="exportPDFSummary">PDF Olarak İndir</button>
  </div>
</template>


<script setup>
import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold} from '@/pdf-fonts/RobotoFonts.js';

// 📦 LocalStorage'dan verileri al
const userMail = ref(localStorage.getItem('userEmail') || '');
const weekId = ref(localStorage.getItem('weekId'));
const meetId = ref(localStorage.getItem('meetId'));
const orders = ref([]);
const rate = ref(0);

// 💰 Toplam tutar hesaplama
const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 📊 Ürün bazlı özet verisi
const groupedSummary = computed(() => {
  const summaryMap = {};
  for (const order of orders.value) {
    const key = order.product_id;
    if (!summaryMap[key]) {
      summaryMap[key] = {
        product_id: order.product_id,
        product_name: order.product_name,
        price: order.price,
        total_quantity: 0,
        total_amount: 0
};
}
    summaryMap[key].total_quantity += order.quantity;
    summaryMap[key].total_amount += order.quantity * order.price;
}
  return Object.values(summaryMap);
});

// 🚀 Sayfa yüklendiğinde siparişleri ve oranı getir
onMounted(async () => {
  await fetchOrders();
  rate.value = await fetchRateForAmount(totalAmount.value);
});

// 📥 Siparişleri Supabase'den çek
async function fetchOrders() {
  const userName = localStorage.getItem('userName') || '';
  const userType = localStorage.getItem('userType');
  const userEmail = localStorage.getItem('userEmail');
  const companyName = localStorage.getItem('companyName')?.trim() || '';

  const { data: allSuppliers} = await supabase
.from(`suppliers_${companyName}`)
.select('id, supplier_name, email');

  const { data: allUsers} = await supabase
.from(`users_${companyName}`)
.select('email, name');

  const userMap = Object.fromEntries(
    allUsers.map(user => [user.email, user.name])
);

  const supplier = allSuppliers?.find(s => s.email === userEmail);
  const allowedSupplierId = supplier?.id;

  const { data: allOrders, error} = await supabase
.from(`order_items_${companyName}`)
.select('supplier_id, product_id, name, description, quantity, price, user_mail, created_at')
.eq('meet_id', meetId.value)
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

  orders.value = filteredOrders.map(order => ({
...order,
    product_name: order.name,
    supplier_name: supplierMap[order.supplier_id] || 'Bilinmeyen Üretici',
    user_name: userMap[order.user_mail] || 'Tanımsız Kullanıcı'
}));
}

// 📄 PDF çıktısı: ürün bazlı özet
function exportPDFSummary() {
  const doc = new jsPDF();

  // Fontları tanıt
doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

doc.setFont('Roboto'); // normal
doc.setFont('Roboto', 'bold'); // kalın

   // Başlık metni
  const baslik = `Toplu Sipariş Özeti - Tarih: ${weekId.value}, Hafta Kodu: ${meetId.value}`;
  doc.text(baslik, 14, 15);

  // Dinamik dosya adı
  const dosyaAdi = `siparis_ozeti_${weekId.value}_${meetId.value}.pdf`;

  const tableData = groupedSummary.value.map(item => [
    item.product_name,
    `${formatPrice(item.price)} ₺`,
    `${formatPrice(item.total_quantity)}`,
    `${formatPrice(item.total_amount)} ₺`
  ]);

  autoTable(doc, {
    head: [['Ürün', 'Fiyat', 'Toplam Miktar', 'Toplam Tutar']],
    body: tableData,
    startY: 20,
    styles: {
      font: 'Roboto',
      fontSize: 10,
      cellPadding: 3
},
    headStyles: {
      fillColor: [39, 174, 96],
      textColor: 255,
      halign: 'center'
},
    bodyStyles: {
      valign: 'middle'
},
    columnStyles: {
      1: { halign: 'right'},
      2: { halign: 'right'},
      3: { halign: 'right'}
}
});

  // 📌 Genel toplamı hesapla
  const grandTotal = groupedSummary.value.reduce(
    (sum, item) => sum + item.total_amount,
    0
);

  // 📌 Sayfanın sağ alt köşesine yaz
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = 14;
  const text = `Genel Toplam: ${formatPrice(grandTotal)} ₺`;
  const textWidth = doc.getTextWidth(text);

  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(text, pageWidth - textWidth - marginRight, doc.lastAutoTable.finalY + 10);

   doc.save(dosyaAdi);

}


// 🕒 Tarih biçimlendirme (isteğe bağlı)
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
}).format(date);
}
</script>

<style scoped>
.order-summary {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'Roboto', sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-summary h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

thead {
  background-color: #27ae60;
  color: white;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
}

td:nth-child(2),
td:nth-child(3),
td:nth-child(4) {
  text-align: right;
}

tr:hover {
  background-color: #f1f1f1;
}

button {
  display: block;
  margin: 0 auto;
  padding: 0.6rem 1.2rem;
  background-color: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #1f6391;
}

.grand-total {
  text-align: right;
  font-size: 1.1rem;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 2px solid #ccc;
  color: #2c3e50;
}

</style>
