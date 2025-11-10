<template>
  <div class="profil-formu">
    <h2>Üretici Bilgileri</h2>

    <div class="form-grup">
      <label>E-posta</label>
      <input v-model="supplier.email" type="email" disabled />
    </div>

    <div class="form-grup">
      <label>Bilgi</label>
      <textarea v-model="supplier.location" rows="3"></textarea>
    </div>

    <div class="form-grup">
      <label>Listede Görüneceğiniz Ad</label>
      <textarea v-model="supplier.name" rows="3"></textarea>
    </div>

    <div class="form-row">
      <label style="min-width: 40px;">İl/İlçe</label>
      <input v-model="supplier.il" type="text" placeholder="İl" />
      <input v-model="supplier.ilce" type="text" placeholder="İlçe" style="margin-left: 10px;" />
       <button @click="openMap">📍 Konum Bilgisi</button>
    </div>

    <div class="form-grup">
      <label>Üretici Sorumlusu</label>
      <input v-model="supplier.sorumlu" type="text" />
    </div>

    <div class="form-grup">
      <label>Üretici Telefonu</label>
      <input :value="formatPhoneNumber(supplier.phone)" type="text" disabled />
    </div>

    <div class="form-row">
      <label style="min-width: 85px;">1.nci Banka</label>
      <input v-model="supplier.bank1" type="text" placeholder="Banka adı 1" />
      <input v-model="supplier.branch1" type="text" placeholder="Banka Şubesi 1" style="margin-left: 10px;" />
      <input v-model="supplier.iban1" type="text" placeholder="IBAN 1" style="margin-left: 10px;" />
    </div>
    <div class="form-row">
      <label style="min-width: 85px;">2.nci Banka</label>
      <input v-model="supplier.bank2" type="text" placeholder="Banka adı 2" />
      <input v-model="supplier.branch2" type="text" placeholder="Banka Şubesi 2" style="margin-left: 10px;" />
      <input v-model="supplier.iban2" type="text" placeholder="IBAN 2" style="margin-left: 10px;" />
    </div>

    <div class="form-grup">
      <label>Aktif mi?</label>
      <input type="checkbox" v-model="supplier.isActive" />
    </div>

    <div class="form-grup">
      <label>Kargo Gönderiyor mu?</label>
      <input type="checkbox" v-model="supplier.isCargo" />
    </div>

    <button @click="saveProfile">💾 Bilgileri Kaydet</button>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService';
import { formatPhoneNumber} from '@/utils/formatters';

const userEmail = localStorage.getItem('userEmail') || '';
const companyName = ref(localStorage.getItem('companyName')?.trim() || '');
const supplier = ref({
  supplier_name: '',
  location: '',
  name: '',
  email: '',
  il:'',
  ilce: '',
  sorumlu: '',
  phone:'',
  bank1:'',
  branch1:'',
  iban1: '',
  bank2:'',
  branch2:'',
  iban2: '',
  konum:'',
  isActive: false,
  isCargo: false
});

// Harita Gösterme Konum Yeri
function openMap() {
  const link = supplier.value.konum;

  if (link) {
    window.open(link, '_blank');
} else {
    alert('Bu üretici için konum bilgisi tanımlı değil.');
}
}

onMounted(async () => {
  // 1. Tedarikçi bilgisi
  const { data: supplierData, error: supplierError} = await supabase
.from(`suppliers_${companyName.value}`)
.select('*')
.eq('email', userEmail)
.single();

  if (supplierData &&!supplierError) {
    supplier.value = supplierData;
}

  // 2. Kullanıcı telefon bilgisi
  const { data: userData, error: userError} = await supabase
.from(`users_${companyName.value}`)
.select('phone')
.eq('email', userEmail)
.single();



  if (userData &&!userError) {
    supplier.value.phone = userData.phone; // supplier objesine ekleniyor
}

});

async function saveProfile() {
  const { error} = await supabase
.from(`suppliers_${companyName.value}`)
.update({
      supplier_name: supplier.value.supplier_name,
      location: supplier.value.location,
      name: supplier.value.name,
      il: supplier.value.il,
      ilce: supplier.value.ilce,
      sorumlu: supplier.value.sorumlu,
      bank1: supplier.value.bank1,
      branch1: supplier.value.branch1,
      iban1: supplier.value.iban1,
      bank2: supplier.value.bank2,
      branch2: supplier.value.branch2,
      iban2: supplier.value.iban2,
      isActive: supplier.value.isActive,
      isCargo: supplier.value.isCargo
})
.eq('email', supplier.value.email);

  if (!error) {
    alert('✅ Bilgiler başarıyla güncellendi.');
} else {
    console.error('❌ Güncelleme hatası:', error);
    alert('Bilgiler kaydedilemedi.');
}
}
</script>

<style scoped>
.profil-formu {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}
.form-grup {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 10px; /* kutular arası boşluk */
  margin-bottom: 10px;
}
label {
  font-weight: bold;
  margin-bottom: 4px;
}
input[type="text"],
input[type="email"],
textarea  {
  width:100%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

input[type="checkbox"] {
  transform: scale(1.2);
  margin-top: 4px;
}
button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
