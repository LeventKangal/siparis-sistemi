<template>
  <nav class="sidebar">
    <h2>{{companyNameB}} Sipariş Sistemi</h2>
    <ul class="menu-list">
       
      <li @click="router.push('/about')">ℹ️ Hakkında</li>
      <li @click="router.push('/info')">ℹ️ Info</li>

      <li class="submenu-title" v-if="['T', 'A'].includes(userType)">📦 Sipariş</li>
      <ul class="submenu" v-if="['T', 'A'].includes(userType)">   <!-- Sipariş menüleri -->
        <li @click="router.push('/orders/entry')">→ Giriş</li>
        <li @click="router.push('/orders/list')">→ Görüntüleme</li>
        <li @click="router.push('/orders/export')">→ Listeleme</li> 
        <li @click="router.push('/orders/update')">→ Değişiklik</li>
        <li @click="router.push('/orders/delete')">→ İptal</li>
      </ul>

      <li class="submenu-title" v-if="['U', 'A'].includes(userType)">🏭 Üretici İşlemleri</li>
      <ul class="submenu" v-if="['U', 'A'].includes(userType)">   <!-- Üretici menüleri -->
        <li @click="router.push('/suppliers/product')">→ Ürün İşlemleri</li>
        <li @click="router.push('/suppliers/orders')">→ Üretici Siparişleri</li>
        <li @click="router.push('/suppliers/print')">→ Ürün Listesi Yazdırma</li>
      </ul>

      <li class="submenu-title" v-if="userType === 'A'">🗄️ Veri Tabanı</li>
      <ul class="submenu" v-if="userType === 'A'">    <!-- Admin menüleri -->
        <li @click="router.push('/db/users')">→ Kullanıcı Tanımlama</li>
        <li @click="router.push('/db/supplier')">→ Üretici Tanımlama</li>
        <li @click="router.push('/db/date')">→ Dağıtım Tarihi Giriş</li>
        <li @click="router.push('/db/rates')">→ Kasa Payı</li>
        <li @click="router.push('/db/productAdmin')">→ Ürün İşlemleri</li>
        <li @click="router.push('/db/CargoManager')">→ Kargo İşlemleri</li>
      </ul>
      <li class="submenu-title" v-if="userType === 'P'">🗄️ Kasa İşlemleri</li>
      <ul class="submenu" v-if="userType === 'P'">    <!-- Kasa menüleri -->
        <li @click="router.push('/ks/take')">→ Türetici Seçim</li>
        <li @click="router.push('/ks/add')">→ Giriş</li>
        <li @click="router.push('/ks/update')">→ Değişiklik</li>
        <li @click="router.push('/ks/delete')">→ Silme</li>
        <li @click="router.push('/ks/give')">→ Üretici Para Ödeme</li> 
        <li @click="router.push('/ks/payment')">→ Ödeme Özeti</li>
        <li @click="router.push('/ks/summary')">→ Dağıtım Sonucu</li> 
        </ul>
    </ul>

    <div class="user-info">
      <p>👤 Kullanıcı: <strong>{{ userName}}</strong></p>
      <p>🆔 Dağıtım #: <strong>{{ meetId}}</strong></p>
      <p>📅 Tarih    : <strong>{{ weekId}}</strong></p>
      <button @click="logout">🚪 Çıkış</button>   
    </div>
  </nav>
</template>

<script setup>

import { useRouter} from 'vue-router';
import { ref, onMounted} from 'vue';

const router = useRouter();

onMounted(() => {
  console.log("Sidebar'da kullanıcı tipi:", userType);
});

const userName = localStorage.getItem('userName') || 'Bilinmeyen Kullanıcı';
const meetId = localStorage.getItem('meetId') || 'Yok';
const weekId = localStorage.getItem('weekId') || 'Tanımsız';
const userType = localStorage.getItem('userType') || '';
const companyName = localStorage.getItem('companyName') || ''; // ✅ sadeleştirilmiş versiyon
const companyNameB = companyName.charAt(0).toUpperCase() + companyName.slice(1);

const fullMenu = [
  { title: "Siparişler", path: "/orders", roles: ["T", "A"]},
  { title: "Ürün Yönetimi", path: "/products", roles: ["U", "A"]},
  { title: "Kullanıcı Yönetimi", path: "/users", roles: ["A"]},
  { title: "Kasa Yönetimi", path: "/ks", roles: ["P"]} 
];

function logout() {
  localStorage.clear();
  router.push('/login');
}
</script>
<style scoped>

.user-info {
  position: relative;
  top: -18px;
}

.user-info button {
  background-color: #e53935;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  margin-top: 6px;
  width: 100%;
  max-width: 180px;
}

.user-info button:hover {
  background-color: #c62828;
}

.user-info p {
  margin: 4px 0; /* satırlar arası boşluk daraltıldı */
}

</style>
