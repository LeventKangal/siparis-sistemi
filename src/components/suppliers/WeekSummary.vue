<template>
  <div style="margin-top: 30px">
    <!-- PDF ve Excel Aktarma Butonları -->
    <button @click="exportPDF">📄 PDF'e Aktar</button>
    <button v-if="userType === 'A'" @click="exportExcel">📊 Excel'e Aktar</button>

    <!-- Hafta Seçimi Dropdown -->
    <select v-model="selectedMeetId" @change="fetchOrders" style="margin: 20px 0;">
      <option v-for="id in availableMeetIds":key="id":value="id">
        {{ meetIdLabels[id]}}
      </option>
    </select>

    <div class="order-summary">
      <h2>Türetici Sıralı Siparişler</h2>
      <div style="margin-top: 1rem; font-weight: bold; text-align: right;">
  🧮 Toplam Sipariş Veren: {{ uniqueUserCount}} kişi<br>
  💰 Toplam Harcama: {{ formatPrice(totalAmount)}} ₺
       </div>
      

      <div v-if="orders.length">
        <div class="table-wrapper">
          <table class="siparis-tablosu">
            <thead>
              <tr>
                <th v-if="userType === 'A'" style="width: 80px;">Üretici</th>
                <th>Ürün Adı</th>
                <th>Birim</th>
                <th style="text-align: right;">Fiyat</th>
                <th style="text-align: right;">Miktar</th>
                <th style="text-align: right;">Toplam</th>
                <th v-if="userType !== 'A'" style="width: 80px;"> </th>
                <th v-if="userType !== 'A'" >Türetici</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(order, index) in orders" :key="order.product_id + '-' + index">
                <tr :class="{ 'user-break': isNewUser(index)}">
                  <td v-if="userType === 'A'" >{{ order.supplier_name || 'Tanımsız'}}</td>
                  <td>{{ order.product_name?.substring(0, 30)}}</td>
                  <td style="text-align: left;">{{ order.unit?.substring(0, 15)}}</td>
                  <td>{{ formatPrice(order.price)}} ₺</td>
                  <td>{{ formatPrice(order.quantity)}}</td>
                  <td style="text-align: right;">{{ formatPrice(order.quantity * order.price)}} ₺</td>
                <!-- <td>{{ order.user_name || 'Tanımsız'}}</td> --> 
                </tr>
                <tr v-if="isLastOfUser(index)">
                  <td colspan="4"></td>
                  <td style="text-align: right; font-weight: bold;">Toplam:</td>
                  <td style="text-align: right; font-weight: bold;">
                       {{ formatPrice(userTotals[order.user_name] || 0)}} ₺
                  </td>
                  <td style="text-align: left; font-weight: bold;">{{ order.user_name || 'Tanımsız'}}</td>
                  <td></td>
                </tr>
              </template>
           <!--   <tr>
                <td colspan="4"></td>
                <td style="text-align: right; font-weight: bold;">Toplam TL</td>
                <td style="text-align: right; font-weight: bold;">{{ formatPrice(totalAmount)}} ₺</td>
                <td></td>
              </tr>   -->
            </tbody>
          </table>
        </div>   

        <!-- Kullanıcı Bazlı Harcama Özeti 
        <div style="margin-top: 2rem;">
          <h3>Kullanıcı Bazlı Harcama</h3>
          <ul>
            <li v-for="(amount, user) in userTotals":key="user">
              {{ user}} → {{ formatPrice(amount)}} ₺
            </li>
          </ul>
        </div> -->
      </div>

      <div v-else>
        <p>Henüz siparişiniz bulunmamaktadır.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as XLSX from 'xlsx';
import { saveAs} from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold} from '@/pdf-fonts/RobotoFonts.js';

import { ref, onMounted, computed} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice, formatDate} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';
import { orderListService} from '@/services/orderListService';

const userType = localStorage.getItem('userType');
const userMail = localStorage.getItem('userEmail') || '';
const selectedMeetId = ref(localStorage.getItem('meetId'));
const availableMeetIds = ref([]);
const meetIdLabels = ref({});
const orders = ref([]);
const rate = ref(0);

async function fetchAvailableWeeks() {
  const company = localStorage.getItem('companyName')?.trim() || '';
  const { data, error} = await supabase
.from(`dates_${company}`)
.select('meet_id, week_id')
.order('meet_id', { ascending: false});

  if (error) {
    console.error('Hafta listesi alınamadı:', error);
    return;
}

  const cleaned = data
.map(item => ({
      meet_id: item.meet_id?.trim(),
      week_id: item.week_id?.trim()
}))
.filter(item => item.meet_id)
.sort((a, b) => Number(b.meet_id) - Number(a.meet_id));

  availableMeetIds.value = cleaned.map(item => item.meet_id);
  meetIdLabels.value = Object.fromEntries(
    cleaned.map(item => [
      item.meet_id,
      `${item.meet_id} – ${formatDate(item.week_id)}` 
    ])
);

  if (!selectedMeetId.value && availableMeetIds.value.length) {
    selectedMeetId.value = availableMeetIds.value[0];
}
}

const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const uniqueUserCount = computed(() => {
  const userSet = new Set();
  orders.value.forEach(order => {
    if (order.user_name) {
      userSet.add(order.user_name.trim().toLowerCase());
}
});
  return userSet.size;
});

const userTotals = computed(() => {
  const totals = {};
  orders.value.forEach(order => {
    const user = order.user_name || 'Tanımsız';
    if (!totals[user]) totals[user] = 0;
    totals[user] += order.total;
});
  return totals;
});


function isNewUser(index) {
  if (index === 0) return true;
  const current = orders.value[index];
  const previous = orders.value[index - 1];
  if (!current ||!previous) return false;
  return current.user_name!== previous.user_name;
}

function isLastOfUser(index) {
  const current = orders.value[index];
  const next = orders.value[index + 1];
 // if (!current || !next) return true;
  return!next || current?.user_name!== next?.user_name;
}

onMounted(async () => {
  await fetchAvailableWeeks();
  await fetchOrders();
  rate.value = await fetchRateForAmount(totalAmount.value);
});

async function fetchOrders() {
  orders.value = [];

  const company = localStorage.getItem('companyName')?.trim() || '';

  const { data: allSuppliers} = await supabase
.from(`suppliers_${company}`)
.select('id, supplier_name, email');

  const { data: allUsers} = await supabase
.from(`users_${company}`)
.select('email, name');

  const userMap = Object.fromEntries(
    allUsers.map(user => [user.email, user.name])
);

  const supplier = allSuppliers?.find(s => s.email === userMail);
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
      products:product_id (unit)
    `)
.eq('meet_id', selectedMeetId.value);

  if (userType === 'A') {
    query = query
.order('user_mail', { ascending: true})
.order('supplier_id', { ascending: true})
.order('product_id', { ascending: true});
}

  if (userType === 'U') {
    query = query
.order('user_mail', { ascending: true})
.order('supplier_id', { ascending: true});
}

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
  orders.value = filteredOrders.map(order => {
  const userName = userMap[order.user_mail] || 'Tanımsız Kullanıcı';
  const supplierName = supplierMap[order.supplier_id] || 'Bilinmeyen Üretici';
  const price = Number(order.price);
  const quantity = Number(order.quantity);
  const total = price * quantity;

  
  return {
...order,
    product_name: order.name,
    supplier_name: supplierName,
    user_name: userName,
    unit: order.products?.unit || '',
    total
};
 });

  function exportPDF() {

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

}
</script>

<style scoped>

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