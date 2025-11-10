<template>
  <div class="payment-manager">
    <h2>📋 Ödeme Kayıtları Yönetimi</h2>

    <!-- 🔍 Filtre Paneli -->
    <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
      <input
         v-model="searchQuery"
          placeholder="İsim veya toplantı ID ara"
          style="padding: 6px; width: 250px;" />

   <!--  <select v-model="statusFilter" style="padding: 6px;">
        <option value="">Tüm Durumlar</option>
        <option value="true">Ödendi</option>
        <option value="false">Bekliyor</option>
         </select>
      <select v-model="sortOrder" style="padding: 6px;">
        <option value="desc">📅 En Yeni</option>
        <option value="asc">📅 En Eski</option>
      </select>    -->
    </div>

    <!-- 📄 Kayıt Tablosu -->
<table v-if="sortedRecords.length> 0">
  <thead>
    <tr>
      <th style="width: 180px; text-align: left;">Kullanıcı</th>
      <th style="width: 50px;">Toplantı</th>
      <th style="width: 90px; text-align: right;">Ödeme</th>
      <th style="width: 60px;">Kasa Payı</th>
      <th style="width: 80px; text-align: left;">Ödeme Tipi</th>
      <th>Nakit Ödeme</th>
      <th>EFT Ödeme</th>
      <th>Kredi Ödeme</th>
    <!-- <th>Durum</th>  -->
      <th style="text-align: center;">İşlem</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="rec in sortedRecords":key="rec.meet_id + '_' + rec.name">
      <td style="width: 180px; text-align: left;">{{ rec.name}}</td>
      <td style="width: 50px; text-align: center;">{{ rec.meet_id}}</td>
      <td style="text-align: right; width: 90px;">
             {{ rec.payment? formatPrice(rec.payment) + ' ₺': ''}}
      </td>
      <td style="text-align: right; width: 60px;">
             {{ rec.rate? formatPrice(rec.rate) + ' ₺': ''}}
      </td>

      <td style="width: 80px; text-align: left;">{{ rec.payment_type}}</td>
      <td style="text-align: right;">
  {{ rec.payment_nakit? formatPrice(rec.payment_nakit) + ' ₺': ''}}
</td>
<td style="text-align: right;">
  {{ rec.payment_eft? formatPrice(rec.payment_eft) + ' ₺': ''}}
</td>
<td style="text-align: right;">
  {{ rec.payment_kredi? formatPrice(rec.payment_kredi) + ' ₺': ''}}
</td>
   <!--   <td>
        <select v-model="rec.isChecked" @change="markEdited(rec)">
          <option value="true">Ödendi</option>
          <option value="false">Bekliyor</option>
        </select>
      </td>   -->
      <td style="text-align: right;">
        <button @click="archiveAndDeleteRecord(rec)">🗑️ Sil</button>
      </td>
    </tr>
  </tbody>
<tfoot>
  <tr style="font-weight: bold; background-color: #f9f9f9;">
    <td colspan="2" style="text-align: right;">Toplam:</td>
    <td style="text-align: right;">{{ formatPrice(totalPayment)}} ₺</td>
    <td style="text-align: right;">{{ formatPrice(totalRate)}} ₺</td>
    <td></td>
    <td style="text-align: right;">{{ formatPrice(totalNakit)}} ₺</td>
    <td style="text-align: right;">{{ formatPrice(totalEft)}} ₺</td>
    <td style="text-align: right;">{{ formatPrice(totalKredi)}} ₺</td>
    <td></td>
  </tr>
</tfoot>
</table>

    <!-- 💾 Kaydet Butonu -->
    <div v-if="Object.keys(edited).length> 0" style="text-align: right; margin-top: 20px;">
      <button @click="applyUpdates">💾 Değişiklikleri Kaydet</button>
    </div>
  </div>
</template>

<script setup>
import { toRaw, ref, computed, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';

const companyName = localStorage.getItem('companyName') || '';

const records = ref([]);
const edited = ref({});
const emailToNameMap = ref({});

const searchQuery = ref('');
const statusFilter = ref('');
const sortOrder = ref('desc');


async function fetchUsers() {
  const { data, error} = await supabase
.from(`users_${companyName}`)
.select('email, name');


  if (error) {
    console.error('❌ Kullanıcı listesi alınamadı:', error);
    return;
}

  emailToNameMap.value = Object.fromEntries(
    data.map(user => [user.email, user.name])
);
}

async function fetchRecords() {
  const { data, error} = await supabase.from(`orders_${companyName}`)
  .select('*');
  if (error) {
    console.error('❌ Kayıtlar alınamadı:', error);
    return;
}
  records.value = data;
}
const totalPayment = computed(() =>
  sortedRecords.value?.length
    ? sortedRecords.value.reduce((sum, r) => sum + (r.payment || 0), 0)
    : 0
);

const totalRate = computed(() =>
  sortedRecords.value.reduce((sum, r) => sum + (r.rate || 0), 0)
);
const totalNakit = computed(() =>
  sortedRecords.value.reduce((sum, r) => sum + (r.payment_nakit || 0), 0)
);
const totalEft = computed(() =>
  sortedRecords.value.reduce((sum, r) => sum + (r.payment_eft || 0), 0)
);
const totalKredi = computed(() =>
  sortedRecords.value.reduce((sum, r) => sum + (r.payment_kredi || 0), 0)
);

function markEdited(rec) {
  const key = `${rec.meet_id}_${rec.name}`;
  edited.value[key] = {...rec};
}

async function applyUpdates() {
  const entries = Object.entries(edited.value);
  for (const [key, rec] of entries) {
    const { error} = await supabase
.from(`orders_${companyName}`)
.update({
        payment: rec.payment,
        rate: rec.rate,
        payment_type: rec.payment_type,
        isChecked: rec.isChecked
})
.eq('meet_id', rec.meet_id)
.eq('name', rec.name);

    if (error) {
      console.error('❌ Güncelleme hatası:', error);
}
}
  edited.value = {};
  await fetchRecords();
}

async function archiveAndDeleteRecord(rec) {

  const rawRec = toRaw(rec);

  // Alan adlarını düzelt
  const {
    created_at, // Supabase kendisi set etsin
    isChecked,
    ...rest
  } = rawRec;

  const cleanRec = {
    ...rest,
    isChecked: isChecked // doğru isimle gönder
  };

  if (cleanRec.isEft === null || cleanRec.isEft === undefined) {
    delete cleanRec.isEft;
  }

  const { data: archiveData, error: archiveError } = await supabase
    .from(`orders_archive_${companyName}`)
    .upsert([cleanRec], { onConflict: ['meet_id', 'name', 'user_type'] });


  if (archiveError) {
    console.error('❌ Arşivleme hatası:', archiveError?.message || archiveError);
    return;
  }

  console.log('✅ Arşiv sonucu:', archiveData);

  const { error: deleteError } = await supabase
    .from(`orders_${companyName}`)
    .delete()
    .eq('meet_id', rec.meet_id)
    .eq('name', rec.name)
    .eq('user_type', rec.user_type);

  if (deleteError) {
    console.error('❌ Silme hatası:', deleteError);
  } else {
    await fetchRecords();
  }
}




const filteredRecords = computed(() =>
  records.value.filter(rec => {

    const matchesSearch =
      rec.user_mail?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      rec.meet_id?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      rec.name?.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === ''
? true
: String(rec.isChecked) === statusFilter.value;

    return matchesSearch && matchesStatus;
})
);

const sortedRecords = computed(() => {
  const sorted = [...filteredRecords.value];
  sorted.sort((a, b) => {
    const nameA = (emailToNameMap.value[a.user_mail] || '').toLowerCase();
    const nameB = (emailToNameMap.value[b.user_mail] || '').toLowerCase();
    return nameA.localeCompare(nameB);
});
  return sorted;
});

onMounted(async () => {
  await fetchUsers();
  await fetchRecords();
});
</script>

<style scoped>

.payment-manager {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  padding: 8px;
  border-bottom: 1px solid #ccc;
  font-size: 14px;
  border: 1px solid #ccc; /* Hem yatay hem dikey çizgi */
}
input[type="number"] {
  width: 80px;
}
select {
  padding: 4px;
}
button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
