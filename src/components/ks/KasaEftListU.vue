<template>
  <div class="eft-report">
    <h2 v-if="userType !== 'U'">Üretici EFT Raporu </h2>
    <h2 v-if="userType === 'U'" >EFT Bilgisi </h2>
    <button v-if="userType !== 'U'" @click="exportToExcel">Excel Olarak Dışa Aktar</button>
    <h2> </h2>
    <button v-if="userType !== 'U'" @click="exportToPDF">PDF Olarak Dışa Aktar</button> 
    <h2> </h2>
    <table>
      <thead>
        <tr>
          <th style="text-align: left; width: 100px;">İsim</th>
          <th style="text-align: right; width: 100px;">Toplam Alacak</th>
          <th style="text-align: right; width: 100px;">Yapılan Ödeme</th>
          <th style="text-align: center; width: 100px;">Kalan Tutar(Eft)</th>
          <th style="text-align: center; width: 100px;">Ödeme Durumu</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rec in eftRecords":key="rec.name">
  <td>{{ rec.name}}</td>
  <td style="text-align: right;">{{ formatPrice(rec.payment)}} ₺</td>
  <td style="text-align: right;">{{ formatPrice(rec.payment_made)}} ₺</td>
  <td style="text-align: right;">{{ formatPrice(rec.payment_left)}} ₺</td>
  <td style="text-align: center;">
    <span v-if="rec.isEft"  style="color: green;">✔️ Ödendi</span>
    <span v-else style="color: red;">❌ Ödeme Bekliyor</span>
    <div v-if="userType!== 'U'" style="margin-top: 8px;">
      <button @click="markAsPaid(rec)" style="margin-right: 0px;">Ödendi</button>
      <button @click="undoPayment(rec)" style="margin-left: 0px; margin-top: 8px;">Geri Al</button>
    </div>
  </td>
</tr>
      </tbody>
      <tfoot v-if="userType !== 'U'">
        <tr style="font-weight: bold;">
          <td style="text-align: right;">Toplam:</td>
          <td style="text-align: right;">{{ formatPrice(totalPayment)}} ₺</td>
          <td style="text-align: right;">{{ formatPrice(totalMade)}} ₺</td>
          <td style="text-align: right;">{{ formatPrice(totalEft)}} ₺</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue'
import supabase from '@/services/supabaseService'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold} from '@/pdf-fonts/RobotoFonts.js';
import { formatPrice} from '@/utils/formatters';

const companyName = localStorage.getItem('companyName') || '';
const meetId = localStorage.getItem('meetId') || '';
const userType = ref('');
const userName = ref('');

const tableName = `orders_${companyName}`

interface EFTRecord {
  name: string
  payment: number
  payment_made: number
  payment_left: number
  isEft?: boolean;
}

const eftRecords = ref<EFTRecord[]>([])
const totalEft = ref(0)
const totalPayment = ref(0)
const totalMade = ref(0)



// Ödendi İşaretlemesi
const markAsPaid = async (record: EFTRecord) => {
  try {
    const { error} = await supabase
.from(`orders_${companyName}`)
.update({ isEft: true})
.eq('name', record.name)
.eq('meet_id', meetId);

    if (error) {
      console.error('❌ Güncelleme hatası:', error);
      return;
}

    // Yerel veriyi güncelle
    record.isEft = true;
} catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
}
};

// Ödendi işaretlemesini geri alma  (Undo)
const undoPayment = async (record: EFTRecord) => {
  try {
    const { error} = await supabase
.from(`orders_${companyName}`)
.update({ isEft: false})
.eq('name', record.name)
.eq('meet_id', meetId);

    if (error) {
      console.error('❌ Geri alma hatası:', error);
      return;
}

    // Yerel veriyi güncelle
    record.isEft = false;
} catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
}
};

onMounted(async () => {

userType.value = localStorage.getItem('userType')?? '';
userName.value = localStorage.getItem('userName') || 'Bilinmeyen';


  let query = supabase
.from(tableName)
.select('name, payment, payment_nakit, payment_eft, payment_kredi, rate, meet_id, isEft')
.eq('meet_id', meetId)
.is('rate', null);



// 👇 Eğer userType "U" ise, sadece kendi kaydını getir
  if (userType.value === 'U') {
    query = query.eq('name', userName.value.trim());

     console.log('userName:', `"${userName.value}"`);
}


  // 👇 Sıralama en son eklenir
  query = query.order('name', { ascending: true});

  const { data, error} = await query;


  if (error ||!data) {
    console.error('❌ EFT verisi alınamadı:', error)
    return
}

  // Sadece payment_eft null olanları al ve hesapla
  const filtered = data
.filter(r =>!r.payment_eft || r.payment_eft === 0)

.map(r => {
      const payment_made =
        (r.payment_nakit || 0) +
        (r.payment_eft || 0) +
        (r.payment_kredi || 0)
        

      const payment_left = (r.payment || 0) - payment_made

      return {
        name: r.name,
        payment: r.payment || 0,
        payment_made,
        payment_left,
        isEft: r.isEft
}
})

  eftRecords.value = filtered
  totalEft.value = filtered.reduce((sum, r) => sum + r.payment_left, 0)
  totalPayment.value = filtered.reduce((sum, r) => sum + r.payment, 0)
  totalMade.value = filtered.reduce((sum, r) => sum + r.payment_made, 0)

})

// Excel çıkışı
function exportToExcel() {
  const worksheetData = [
    ['İsim', 'Toplam Alacak', 'Ödenen Miktar', 'Yapılacak EFT Tutarı', 'Ödeme Bilgisi'],
...eftRecords.value.map(rec => [
      rec.name,
     `${formatPrice(rec.payment)} ₺`,
     `${formatPrice(rec.payment_made)} ₺`,
     `${formatPrice(rec.payment_left)} ₺`,
      rec.isEft? '✔️ Ödendi': '❌ Ödeme Bekliyor'
      
    ]),


    ['Toplam',
     `${formatPrice(totalPayment.value)} ₺`,
     `${formatPrice(totalMade.value)} ₺`,
     `${formatPrice(totalEft.value)} ₺`]

]

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'EFT Raporu')
  XLSX.writeFile(workbook, 'EFT_Raporu.xlsx')
}

// PDF çıkışı
function exportToPDF() {
  const doc = new jsPDF()

  // Fontları tanıt
doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

doc.setFont('Roboto'); // normal
doc.setFont('Roboto', 'bold'); // kalın

  doc.text('Üretici EFT Raporu', 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['Üretici', 'Toplam Alacak', 'Ödenen Miktar', 'Kalan EFT Miktar', 'Ödeme Bilgisi']],
    body: [
...eftRecords.value.map(rec => [
         rec.name,
        `${formatPrice(rec.payment)} ₺`,
        `${formatPrice(rec.payment_made)} ₺`,
        `${formatPrice(rec.payment_left)} ₺`,
          rec.isEft? '✔️ Ödendi': '❌ Ödeme Bekliyor'
      ]),
      [
        '🧮 TOPLAM',
        `${formatPrice(totalPayment.value)} ₺`,
        `${formatPrice(totalMade.value)} ₺`,
        `${formatPrice(totalEft.value)} ₺`]
    ],
    styles: {
      font: 'Roboto',
      fontSize: 12,
      cellPadding: 3
},
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: 255
            
},
    bodyStyles: {
      valign: 'middle'
},
    columnStyles: {
      0: { halign: 'left'},  // Üretici adı sola
      1: { halign: 'right'}, // Toplam Alacak sağa
      2: { halign: 'right'}, // Ödenen Miktar sağa
      3: { halign: 'right'},  // Kalan EFT sağa
      4: { halign: 'center'}
},
    didParseCell: function (data) {
      // TOPLAM satırını özel biçimlendir
      const isTotalRow = data.row.index === eftRecords.value.length
      if (isTotalRow) {
      //  data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 230, 230] // Açık gri arka plan
        data.cell.styles.textColor = [0, 0, 0]       // Siyah yazı
}
}
})

  doc.save('EFT_Raporu.pdf')
}
   



</script>

<style scoped>
.eft-report {
  padding: 16px;
  max-width: 600px;
  margin: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 8px;
  border-bottom: 1px solid #ccc;
}
tfoot td {
  background-color: #f0f0f0;
}
</style>