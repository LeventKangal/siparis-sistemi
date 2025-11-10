<template>
  <div class="eft-report">
    <h2 v-if="userType !== 'T'">Türetici EFT Raporu </h2>
    <h2 v-if="userType === 'T'" >EFT Bilgisi </h2>
    <button v-if="userType !== 'T'" @click="exportToExcel">Excel Olarak Dışa Aktar</button>
     <h2> </h2>
    <button v-if="userType !== 'T'" @click="exportToPDF">PDF Olarak Dışa Aktar</button>
    <h2> </h2>
    <h5 v-if="companyName === 'geto'">IBAN Bilgisi  TR79 0015 7000 0000 0135 9175 21  Emre Yıldız  *açıklamayı boş bırakabilirsiniz </h5>
    <h5 v-if="companyName === 'ggt'">IBAN Bilgisi  TR20 0015 7000 0000 0099 7169 22		Pınar Öztopcu Kangal	*açıklamayı boş bırakabilirsiniz </h5>
    <h5 v-if="companyName === 'sgt'">IBAN Bilgisi  TR30 0001 5001 5800 7365 1308 32		Osman Baha Okar	*açıklamayı boş bırakabilirsiniz </h5>
    <h2> </h2>
    <table>
      <thead>
        <tr>
          <th style="text-align: left; width: 180px;">İsim</th>
          <th style="text-align: left; width: 120px;">Telefon</th>
          <th style="text-align: right; width: 100px;">EFT Tutarı</th>
          <th style="text-align: center; width: 150px;">Ödeme Durumu</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for= "rec in eftRecords" :key="rec.name">
  <td>{{ rec.name}}</td>
  <td>{{ formatPhoneNumber(rec.phone)}}</td>
  <td  style="text-align: right;">{{ rec.payment_eft.toLocaleString('tr-TR')}} ₺</td>

  <td style="text-align: center;">
    <span v-if="rec.isEft" style="color: green;">✔️ Ödendi</span>
    <span v-else style="color: red;">❌ Ödeme Bekliyor</span>
    <div v-if="userType!== 'T'" style="margin-top: 8px;">
      <button @click="markAsPaid(rec)" style="margin-right: 6px;">Ödendi</button>
      <button @click="undoPayment(rec)">Geri Al</button>
    </div>
  </td>
</tr>
      </tbody>
      <tfoot v-if="userType !== 'T'">
        <tr style="font-weight: bold;">
          <td style="text-align: right;">Toplam:</td>
          <td style="text-align: right;">{{ totalEft.toLocaleString('tr-TR')}} ₺</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPhoneNumber} from '@/utils/formatters';
import { formatPrice} from '@/utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold} from '@/pdf-fonts/RobotoFonts.js';

const companyName = localStorage.getItem('companyName') || '';
const meetId = localStorage.getItem('meetId') || '';
const userType = ref('');
const userName = ref('');


interface EFTRecord {
  name: string;
  payment_eft: number;
  phone?: string;
  isEft?: boolean;
}

const eftRecords = ref<EFTRecord[]>([]);
const totalEft = ref(0);

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

  // Sipariş verilerini sorgula
  let query = supabase
.from(`orders_${companyName}`)
.select('name, payment_eft, rate, meet_id, isEft')
.eq('meet_id', meetId)
.not('rate', 'is', null)
.gt('payment_eft', 0);

  // Eğer kullanıcı türü "T" ise sadece kendi kaydını getir
  if (userType.value === 'T') {
    query = query.eq('name', userName.value);
}

  // Sıralama
  query = query.order('name', { ascending: true});

  // Sipariş verilerini al
  const { data, error} = await query;

  if (error) {
    console.error('❌ EFT verisi alınamadı:', error);
    return;
}

  // EFT tutarı dolu olanları filtrele
  const filtered = data.filter(r => r.payment_eft!== null);

  // Tüm isimleri topla
  const names = filtered.map(r => r.name);

  // Toplu olarak telefon verilerini çek
  const { data: userPhones, error: phoneError} = await supabase
.from(`users_${companyName}`)
.select('name, phone')
.in('name', names);

  if (phoneError) {
    console.error('❌ Telefon verileri alınamadı:', phoneError);
}

  // Telefonları eşleştir
  const phoneMap = new Map<string, string>();
  userPhones?.forEach(user => {
    phoneMap.set(user.name, user.phone || 'Bilinmiyor');
});

  // EFT kayıtlarını telefonlarla birleştir
  const filteredWithPhones: EFTRecord[] = filtered.map(record => ({
    name: record.name,
    payment_eft: record.payment_eft,
    phone: phoneMap.get(record.name) || 'Bilinmiyor',
    isEft: record.isEft?? false // Supabase'den gelen değer
}));

  // Sonuçları kaydet
  eftRecords.value = filteredWithPhones;
  totalEft.value = filteredWithPhones.reduce((sum, r) => sum + (r.payment_eft || 0), 0);
});

// Excel çıkışı
const exportToExcel = () => {
const worksheetData = eftRecords.value.map(rec => ({
  İsim: rec.name,
  'Telefon': formatPhoneNumber(rec.phone) || 'Bilinmiyor',
  'EFT Tutarı (₺)': rec.payment_eft + '₺',
  'Ödeme Bilgisi' : rec.isEft? '✔️ Ödendi': '❌ Ödeme Bekliyor'
}));
// En alta toplam satırı ekle
  worksheetData.push({
    İsim: 'Toplam',
    'Telefon': '',
    'EFT Tutarı (₺)': `${totalEft.value.toLocaleString('tr-TR')} ₺`
});


  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'EFT Raporu');

  XLSX.writeFile(workbook, 'eft_raporu.xlsx');
};

// PDF çıkışı
const exportToPDF = () => {
  const doc = new jsPDF();
  // Fontları tanıt
doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

doc.setFont('Roboto'); // normal
doc.setFont('Roboto', 'bold'); // kalın

  doc.setFontSize(14);
  doc.text('Türetici EFT Raporu', 14, 20);

  const tableData = eftRecords.value.map(rec => [
    rec.name,
    rec.phone,
    `${rec.payment_eft.toLocaleString('tr-TR')} ₺`,
     rec.isEft
  ]);


     autoTable(doc, {
  head: [['Ad Soyad', 'Telefon', 'EFT Tutar', 'Ödeme Bilgisi']],
  body: eftRecords.value.map(rec => [
    rec.name,
    formatPhoneNumber(rec.phone) || 'Bilinmiyor',
    `${rec.payment_eft.toLocaleString('tr-TR')} ₺`,
     rec.isEft? '✔️ Ödendi': '❌ Ödeme Bekliyor'
  ]),
  startY: 30,
  styles: {
    font: 'Roboto',
    fontSize: 12,
    cellPadding: 3,
    cellWidth: 'wrap'
},
  headStyles: {
    fillColor: [41, 128, 185],
    textColor: 255
},
  bodyStyles: {
    valign: 'middle'
},
  columnStyles: {
    0: { halign: 'left', cellWidth: 'auto'},
    1: { halign: 'right'}
},
  didParseCell: function (data) {
    if (data.column.index === 1) {
      data.cell.styles.halign = 'right';
}
}
});

   doc.save('eft_raporu.pdf');
};




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
