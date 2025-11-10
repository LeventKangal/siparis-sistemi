<template>
  <nav class="topbar">
    <div class="menu-left">
      <ul class="menu-list">
        <!-- Genel Menüler
        <li @click="router.push('/about')">ℹ️ Hakkında</li>
        <li @click="router.push('/info')">ℹ️ Info</li>
        <li @click="openMap">📍 Dağıtım Yeri Konumu</li>-->

        <!-- Sipariş Menüsü -->
        <li v-if="['T', 'A'].includes(userType)">
          <div @click="toggleMenu('siparis')">
            📦 Sipariş <span>{{ siparisOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="siparisOpen">
    <!-- Şirket açıksa gösterilecekler -->
    <li v-if="isOpen && isTest" @click="navigateAndClose('/orders/entry', 'siparis')">→ Üretici Bazında Giriş</li>
    <li v-if="isOpen && isTest" @click="navigateAndClose('/orders/search', 'siparis')">→ Ürün bazında Giriş</li>
    <!-- Her zaman görünenler -->
    <li @click="navigateAndClose('/orders/list', 'siparis')">→ Görüntüleme</li>
    <li @click="navigateAndClose('/orders/export', 'siparis')">→ Listeleme</li>
    <li v-if="!isTest" @click="navigateAndClose('/ks/eft', 'uretek')">→ EFT Bilgisi</li>
    <!-- Şirket açıksa gösterilecekler -->
    <li v-if="isOpen && isTest" @click="navigateAndClose('/orders/update', 'siparis')">→ Değişiklik</li>
    <li v-if="isOpen && isTest" @click="navigateAndClose('/orders/delete', 'siparis')">→ İptal</li>
          </ul>
        </li>

        <!-- Üretici Menüsü -->
        <li v-if="['U', 'A'].includes(userType)">
          <div @click="toggleMenu('uretici')">
            🏭 Üretici Siparişleri <span>{{ ureticiOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="ureticiOpen">
       <!-- <li v-if="isOpen" @click="navigateAndClose('/suppliers/product', 'uretici')">→ Ürün İşlemleri</li>-->

            <li @click="navigateAndClose('/suppliers/sorted', 'uretici')">→ Ürün Giriş Sıralı</li>
            <li @click="navigateAndClose('/suppliers/customer', 'uretici')">→ Türetici Sıralı</li>
            <li @click="navigateAndClose('/suppliers/orders', 'uretici')">→ Miktar Güncelleme</li>
            <li @click="navigateAndClose('/suppliers/print', 'uretici')">→ Sipariş Yazdırma</li>
            <li @click="navigateAndClose('/suppliers/summary', 'uretici')">→ Sipariş Toplamları</li>


      <!--  <li @click="navigateAndClose('/suppliers/sort', 'uretici')">→ Ürünleri Sıralama</li>
            <li @click="navigateAndClose('/suppliers/form', 'uretici')">→ Profil Bilgi Girişi</li> -->
          </ul>
        </li>

        <!-- Üretici Ek Menüsü -->
        <li v-if="['U', 'A'].includes(userType)">
          <div @click="toggleMenu('uretek')">
            📒 Üretici İşlemleri <span>{{ uretekOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="uretekOpen">
            <li v-if="isOpen" @click="navigateAndClose('/suppliers/product', 'uretek')">→ Ürün İşlemleri</li>
            <li @click="navigateAndClose('/suppliers/sort', 'uretek')">→ Ürünleri Sıralama</li>
            <li @click="navigateAndClose('/suppliers/form', 'uretek')">→ Üretici Bilgileri</li>
            <li v-if="!isTest" @click="navigateAndClose('/ks/eft1', 'uretek')">→ Ödeme Bilgisi</li>
            <li @click="navigateAndClose('/suppliers/Dashboard', 'uretek')">→ Analiz Bilgileri</li>

          </ul>
        </li>

        <!-- Admin Menüsü -->
        <li v-if="userType === 'A'">
          <div @click="toggleMenu('admin')">
            🗄️ Admin <span>{{ adminOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="adminOpen">
            <li @click="navigateAndClose('/db/users', 'admin')">→ Kullanıcı Tanımlama</li>
            <li @click="navigateAndClose('/db/supplier', 'admin')">→ Üretici Tanımlama</li>
            <li @click="navigateAndClose('/db/date', 'admin')">→ Dağıtım Tarihi Giriş</li>
            <li @click="navigateAndClose('/db/rates', 'admin')">→ Kasa Payı</li>
            <li @click="navigateAndClose('/db/productAdmin', 'admin')">→ Ürün İşlemleri</li>
            <li @click="navigateAndClose('/db/cargo', 'admin')">→ Kargo İşlemleri</li>
            <li @click="navigateAndClose('/db/cargoP', 'admin')">→ Kargo Hazırlık</li>
            <li @click="navigateAndClose('/db/logview', 'admin')">→ Log Kontrol</li>
            <li @click="navigateAndClose('/db/totallist', 'admin')">→ Dağıtım Özeti</li>

          </ul>
        </li>

        <!-- Kasa Menüsü -->
        <li v-if="userType === 'P'">
          <div @click="toggleMenu('kasa')">
            💰 Kasa <span>{{ kasaOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="kasaOpen">
            <li @click="navigateAndClose('/ks/take', 'kasa')">→ Türetici Seçim</li>
            <li @click="navigateAndClose('/ks/give', 'kasa')">→ Üretici Para Ödeme</li>
            <li @click="navigateAndClose('/ks/payment', 'kasa')">→ Ödeme Özeti</li>
            <li @click="navigateAndClose('/ks/eft', 'kasa')">→ Türetici EFT Listesi</li>
            <li @click="navigateAndClose('/ks/eft1', 'kasa')">→ Üretici EFT Listesi</li>
            <li @click="navigateAndClose('/ks/summary', 'kasa')">→ Dağıtım Sonucu</li>
          </ul>
        </li>

        <!-- Kapama Menüsü -->
        <li v-if="userType === 'K'">
          <div @click="toggleMenu('kapama')">
            ⛔ Kapama <span>{{ kapamaOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="kapamaOpen">
            <li @click="navigateAndClose('/reset-schedule', 'kapama')">→ Kapanış Tanımlama</li>
            <li @click="navigateAndClose('/reset-logs', 'kapama')">→ İşlem Geçmişi</li>
            <li @click="navigateAndClose('/restore-stock', 'kapama')">→ Stok Geri Yükleme</li>

          </ul>
        </li>
        <!-- Ödeme Menüsü -->
        <li v-if="userType === 'X'">
          <div @click="toggleMenu('odeme')">
            💰 Ödeme <span>{{ kasaOpen? '▲': '▼'}}</span>
          </div>
          <ul v-if="odemeOpen">
            <li @click="navigateAndClose('/ks/eft', 'kasa')">→ Türetici EFT Listesi</li>
            <li @click="navigateAndClose('/ks/eft1', 'kasa')">→ Üretici EFT Listesi</li>
            <li @click="navigateAndClose('/ks/summary', 'kasa')">→ Dağıtım Sonucu</li>

          </ul>
        </li>
        <button class="logout-button" @click="logout">🚪 Çıkış</button>
      </ul>
    </div>

    <div class="menu-right">
      <li @click="openMap">📍 Dağıtım Yeri Konumu</li>

      <li @click="router.push('/info')">ℹ️ Info</li>
      <li @click="router.push('/about')">ℹ️ Hakkında</li>

    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import { useRouter} from 'vue-router';
import supabase from '@/services/supabaseService';
import { nextTick} from 'vue';

const router = useRouter();

const userType = ref('');
const isOpen = ref(false);
const isTest = ref(false);




// Menü durumları
const siparisOpen = ref(false);
const ureticiOpen = ref(false);
const uretekOpen = ref(false);
const adminOpen = ref(false);
const kasaOpen = ref(false);
const kapamaOpen = ref(false);
const odemeOpen = ref(false);

// Şirket bilgileri
const companyName = localStorage.getItem('companyName') || '';
const weekId = localStorage.getItem('weekId') || '';

// Harita Gösterme Dağıtım Yeri
function openMap() {
  const mapLinks = {
    geto: 'https://www.google.com/maps/place/38.466299,27.085652',
    ggt: 'https://maps.app.goo.gl/5oPzVLMFEzL7QSoX7',
    bitot: 'https://www.google.com/maps/place/38.324480,26.768374',
    sgt: 'https://www.google.com/maps/place/38.1944697133,26.8411677219'
};

  const link = mapLinks[companyName];

  if (link) {
    window.open(link, '_blank');
} else {
    alert('Bu şirket için konum bilgisi tanımlı değil.');
}
}

// Menü aç/kapa fonksiyonu
function toggleMenu(menu) {
  if (menu === 'siparis') siparisOpen.value =!siparisOpen.value;
  if (menu === 'uretici') ureticiOpen.value =!ureticiOpen.value;
  if (menu === 'uretek') uretekOpen.value =!uretekOpen.value;
  if (menu === 'admin') adminOpen.value =!adminOpen.value;
  if (menu === 'kasa') kasaOpen.value =!kasaOpen.value;
  if (menu === 'kapama') kapamaOpen.value =!kapamaOpen.value;
  if (menu === 'odeme') odemeOpen.value =!odemeOpen.value;
}

// Sayfa geçişi ve menü kapatma
function navigateAndClose(path, menu) {
  router.push(path);
  if (menu === 'siparis') siparisOpen.value = false;
  if (menu === 'uretici') ureticiOpen.value = false;
  if (menu === 'uretek') uretekOpen.value = false;
  if (menu === 'admin') adminOpen.value = false;
  if (menu === 'kasa') kasaOpen.value = false;
  if (menu === 'kapama') kapamaOpen.value = false;
  if (menu === 'odeme') odemeOpen.value = false;
}

// Çıkış
function logout() {

  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('meetId');
  localStorage.removeItem('weekId');
  localStorage.removeItem('userType');
  localStorage.removeItem('companyName');

 // localStorage.clear();
  router.push('/login');
}

// Şirketin açık olup olmadığını kontrol et
onMounted(async () => {
  userType.value = localStorage.getItem('userType') || '';
  const { data} = await supabase
.from(`dates_${companyName}`)
.select('isOpen, isTest')
.eq('week_id', weekId)
.maybeSingle();

isOpen.value = data?.isOpen === true;
isTest.value = data?.isTest === true;


await nextTick();


});
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 52px; /* UnifiedHeader yüksekliği kadar */
  left: 0;
  width: 100%;
  z-index: 999;
  background-color: #1976d2;
  color: white;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  flex-wrap: nowrap;


}

/* 🌐 Mobil uyum için media query */
@media (max-width: 768px) {
.topbar {

    flex-direction: column;
    padding: 8px 16px;
}
.logout-button {
    height: 36px;
    box-sizing: border-box;
}
}

.menu-left {
  display: flex;
}

.menu-list {
  display: flex;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-list> li {
  position: relative;
  cursor: pointer;
  font-size: 16px;
}

.submenu-title> div {
  font-weight: bold;
  user-select: none;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  color: black;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 180px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.submenu li {
  padding: 8px 12px;
  cursor: pointer;
}

.submenu li:hover {
  background-color: #f0f0f0;
}

.menu-right {
  display: flex;
  flex-direction: row; /* yatay hizalama */
  gap: 20px; /* öğeler arası yatay boşluk */
  align-items: center;
}
.menu-right li {
  list-style: none;
}


.logout-button {
  background-color: #e53935;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #c62828;
}
</style>
