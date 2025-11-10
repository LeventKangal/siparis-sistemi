<template>

<div style="margin-top: 38px">

</div>

    <div class="order-summary">
    <h2>Türetici Sıralı Siparişler</h2>

    <div v-if="orders.length">
      <div class="table-wrapper">
        <table class="siparis-tablosu">
          <thead>
            <tr>
              <th style="width: 80px;">Üretici</th>
              <th>Ürün Adı</th>
              <th>Birim</th>
              <th style="text-align: right;">Fiyat</th>
              <th style="text-align: right;">Miktar</th>
              <th style="text-align: right;">Toplam</th>
              <th>Türetici</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in orders"  :key="order.product_id"
                     :class="{ 'user-break': isNewUser(index)}">
              <td style="width: 80px;">{{ order.supplier_name || 'Tanımsız'}}</td>
              <td>{{ order.product_name?.substring(0, 30)}}</td>
              <td style="text-align: left;">{{ order.unit?.substring(0, 15)}}</td>
              <td>{{ formatPrice(order.price)}} ₺</td>
              <td>{{ formatPrice(order.quantity)}}</td>
              <td style="text-align: right;">{{ formatPrice(order.quantity * order.price)}} ₺</td>
              <td >{{ order.user_name || 'Tanımsız'}}</td>
            </tr>
            <tr>
             <td colspan="4"></td>
             <td style="width: 100px; text-align: right; font-weight: bold;"> Toplam TL </td>
             <td style="text-align: right; font-weight: bold;">{{ formatPrice(totalAmount)}} ₺</td>
            </tr>

          </tbody>
        </table>
        <button @click="exportPDF">📄 PDF'e Aktar</button>
        <button v-if="userType === 'A'" @click="exportExcel">📊 Excel'e Aktar</button>
        <button
:disabled="!isUrlReady"
:class="{ 'disabled-button':!isUrlReady}"
>
  <a
    v-if="isUrlReady"
:href="`https://wa.me/?text=${encodeURIComponent(url)}`"
    target="_blank"
>
    WhatsApp'ta Paylaş
  </a>
  <span v-else>Bağlantı hazırlanıyor...</span>
</button>
      </div>
    </div>

    <div v-else>
      <p>Henüz siparişiniz bulunmamaktadır.</p>
    </div>
  </div>
</template>

<script setup>
import * as XLSX from 'xlsx';
import { saveAs} from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold} from '@/pdf-fonts/RobotoFonts.js';


import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';
import { computed} from 'vue';
import { orderListService} from '@/services/orderListService';

const userType = localStorage.getItem('userType');
const userMail = ref(localStorage.getItem('userEmail') || '');
const meetId = ref(localStorage.getItem('meetId'));

const orders = ref([]);
const rate = ref(0);
const url = ref('');
const isUrlReady = ref(false);


const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

function isNewUser(index) {
  if (index === 0) return true;
  const current = orders.value[index];
  const previous = orders.value[index - 1];
  if (!current ||!previous) return false;
  return current.user_name!== previous.user_name;
}

onMounted(async () => {
  await fetchOrders(); // siparişleri al
  rate.value = await fetchRateForAmount(totalAmount.value); // oranı al
});

async function fetchOrders() {
  const userEmail = localStorage.getItem('userEmail');
  const company = localStorage.getItem('companyName')?.trim() || '';

  // 👥 Üreticileri al
  const { data: allSuppliers} = await supabase
.from(`suppliers_${company}`)
.select('id, supplier_name, email');

  // 👥 Kullanıcıları al
  const { data: allUsers} = await supabase
.from(`users_${company}`)
.select('email, name');

  // 👥 Haritalama: email → name
  const userMap = Object.fromEntries(
    allUsers.map(user => [user.email, user.name])

);

  const supplier = allSuppliers?.find(s => s.email === userEmail);
  const allowedSupplierId = supplier?.id;

  let query = supabase
.from(`order_items_${company}`)
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

// Eğer user_type "A" ise supplier_id sıralaması yapılmasın
if (userType!== 'A') {
  query = query
.order('supplier_id', { ascending: true});
}

// Diğer sıralamalar her durumda geçerli olabilir
query = query
//.order('name', { ascending: true})
.order('user_mail', { ascending: true})
.order('product_id', { ascending: true});


const { data: allOrders, error} = await query;

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

  // 🧠 Final eşleştirme: supplier + user
  orders.value = filteredOrders.map(order => ({
...order,
    product_name: order.name,
    supplier_name: supplierMap[order.supplier_id] || 'Bilinmeyen Üretici',
    user_name: userMap[order.user_mail] || 'Tanımsız Kullanıcı',
    unit: order.products?.unit || ''

})) .sort((a, b) => a.user_name.localeCompare(b.user_name));
}

//Whatsup link oluşturma
async function uploadPDF(blob) {
  const { data, error} = await supabase.storage
.from('pdfs')
.upload(`siparisler/${Date.now()}.pdf`, blob, {
      contentType: 'application/pdf',
      upsert: true
});

  if (error ||!data) {
    console.error('PDF yüklenemedi:', error);
    return null;
}

  const { data: urlData} = supabase.storage
.from('pdfs')
.getPublicUrl(data.path);

  return urlData?.publicUrl || null;
}

  async function exportPDF() {

  const doc = new jsPDF();

  // Fontları tanıt
doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

doc.setFont('Roboto'); // normal
doc.setFont('Roboto', 'bold'); // kalın
doc.text('Sipariş Özeti', 14, 15);

  const tableData = orders.value.map(order => [
   // order.supplier_name || 'Tanımsız',
    order.product_name,
    order.unit,
    `${formatPrice(order.price)} ₺`,
    formatPrice(order.quantity),
    `${formatPrice(order.price * order.quantity)} ₺`,
    order.user_name,
  ]);

autoTable(doc, {
  head: [['Ürün Ad', 'Birim', 'Fiyat', 'Miktar', 'Toplam', 'Türetici']],
  body: tableData,
  startY: 5,
  styles: {
    font: 'Roboto',
    fontSize: 9,
    cellPadding: 3
},
  headStyles: {
    fillColor: [41, 128, 185], // mavi başlık
    textColor: 255,
    halign: 'left'
},
  bodyStyles: {
    valign: 'middle'
},
  columnStyles: {
    0: { halign: 'left'},  // Ürün Adı
    1: { halign: 'left'},  // Birim
    2: { halign: 'left'},  // Fiyat
    3: { halign: 'right'}, // Miktar
    4: { halign: 'right'}, // Toplam
    5: { halign: 'left'},  // Türetici
}
});

  doc.save('siparisler.pdf');

  const pdfBlob = doc.output('blob');
  const publicUrl = await uploadPDF(pdfBlob);

   if (publicUrl) {
    url.value = publicUrl;
    isUrlReady.value = true; // 🔥 Butonu aktif hale getir
} else {
    console.error('Bağlantı alınamadı.');
    isUrlReady.value = false;
}
}

function exportExcel() {
  if (userType!== 'A') return; // yalnızca admin

//  const excelData = orders.value.map(order => ({
const tableData = orders.value.map(order => ({
    'Üretici': order.supplier_name,
    'Ürün Adı': order.product_name,
    'Birim': order.unit,
    'Fiyat': `${formatPrice(order.price)} ₺`,
    'Miktar': formatPrice(order.quantity),
    'Toplam': `${formatPrice(order.price * order.quantity)} ₺`,
    'Türetici': order.user_name
}));

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siparişler');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array'});
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream'});
  saveAs(blob, 'siparisler.xlsx');
}


</script>

<style scoped>

.disabled-button {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
}

.user-break {
  border-top: 2px solid #2c3e50; /* Kalın çizgi */
  background-color: #f9f9f9;     /* Hafif arka plan tonu */
}

.order-summary {
  padding: 5px;
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
  text-align: left;
}
td:nth-child(3),
td:nth-child(4),
td:nth-child(5) {
  text-align: right;
}
td:nth-child(6) {
  text-align: left;
}


</style>
