<template>
  <div class="gallery-container">
    <h2>📸 Kullanım Klavuzu</h2>
    <div class="gallery-grid">
      <div v-for="(image, index) in images":key="index" class="gallery-item">
  <img :src="image.src" :alt="image.alt" @click="openModal(index)" />
  <p>{{ image.caption}}</p>
       </div>
    </div>

    <!-- Modal Görünüm -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
  <img :src="images[currentIndex].src" :alt="images[currentIndex].alt" />
  <p>{{ images[currentIndex].caption}}</p>
  <button class="close-btn" @click="closeModal">Kapat</button>
     </div>
  </div>
</template>



<script setup>
import { ref} from 'vue';

const companyName = localStorage.getItem('companyName') || '';
const userType  = localStorage.getItem('userType') || '';
let images = [];

if (userType === 'T') {
  images = [
    { src: `/images/${companyName}/Page_01.png`, alt: 'Hoş Geldiniz', caption: '1. Hoş Geldiniz Ekranı.'},
    { src: `/images/${companyName}/Page_02.png`, alt: 'Giriş Ekranı', caption: '2. Giriş Ekranı.'},
    { src: `/images/${companyName}/Page_03.png`, alt: 'Türetici Sipariş Ekranı', caption: '3. Türetici Sipariş Ekranı'},
    { src: `/images/${companyName}/Page_04.png`, alt: 'Türetici Sipariş Seçenekleri', caption: '4. Türetici Sipariş Seçenekleri'},
    { src: `/images/${companyName}/Page_05.png`, alt: 'Üretici Seçme Ekranı', caption: '5. Üretici Seçme Ekranı'},
    { src: `/images/${companyName}/Page_06.png`, alt: 'Üretici Ürünleri', caption: '6. Üretici Ürünleri.'},
    { src: `/images/${companyName}/Page_07.png`, alt: 'Ürün Bazında Arama', caption: '7. Ürün Bazında Arama Ekranı.'},
    { src: `/images/${companyName}/Page_08.png`, alt: 'Türetici Bilgilendirme Ekranı', caption: '8. Türetici Bilgilendirme Ekranı'},
    { src: `/images/${companyName}/Page_09.png`, alt: 'Türetici Siparişleri Görüntüleme', caption: '9. Türetici Siparişleri Görüntüleme + PDF'},
    { src: `/images/${companyName}/Page_10.png`, alt: 'Türetici Siparişleri Görüntüleme', caption: '10. Türetici Siparişleri Görüntüleme'},
    { src: `/images/${companyName}/Page_11.png`, alt: 'Türetici Sipariş Güncelleme', caption: '11. Türetici Sipariş Güncelleme'},
    { src: `/images/${companyName}/Page_12.png`, alt: 'Türetici Sipariş Silme', caption: '12. Türetici Sipariş Silme'},


  ];
} else if (userType === 'U') {
  images = [
    { src: `/images/${companyName}/U1.png`, alt: 'Hoş Geldiniz', caption: '1. Hoş Geldiniz ekranı'},
    { src: `/images/${companyName}/U2.png`, alt: 'Giriş Ekranı', caption: '2. Giriş Ekranı.'},
    { src: `/images/${companyName}/U3.png`, alt: 'Üretici İşlemleri Ekranı', caption: '3. Üretici İşlemleri Ekranı'},
    { src: `/images/${companyName}/U4.png`, alt: 'Ürünleri Düzenleme', caption: '4. Ürünleri Düzenleme Ekranı'},
    { src: `/images/${companyName}/U5.png`, alt: 'Üretici İşlemleri', caption: '5. Üretici İşlemleri'},
    { src: `/images/${companyName}/U6.png`, alt: 'Yeni Ürün Ekleme', caption: '6. Yeni Ürün Ekleme ekranı'},
    { src: `/images/${companyName}/U7.png`, alt: 'Sipariş Görüntüleme', caption: '7. Sipariş Görüntüleme ekranı'},
    { src: `/images/${companyName}/U8.png`, alt: 'Giriş Sıralı Görüntüleme', caption: '8. Giriş Sıralı Görüntüleme ekranı'},
    { src: `/images/${companyName}/U9.png`, alt: 'Siparişleri pdf e Çıkma', caption: '9. Siparişleri pdf e Çıkma ekranı'},
  ];
}


const showModal = ref(false);
const currentIndex = ref(0);

function openModal(index) {
  currentIndex.value = index;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}
</script>

<style scoped>
.gallery-container {
  max-width: 1000px;
  margin: auto;
  padding: 10px;
  font-family: Arial, sans-serif;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.gallery-item img {
  width: 100%;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
  height: 180px; /* sabit yükseklik */
  object-fit: cover;
}

.gallery-item img:hover {
  transform: scale(1.02);
}

.gallery-item p {
  margin-top: 8px;
  font-size: 14px;
  color: #555;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85); /* daha koyu ve net odak */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
  transition: opacity 0.3s ease;
  overflow-y: auto; /* içerik taşarsa kaydırılabilir olsun */
}

.modal img {
  max-width: 100%;
  max-height: 90vh; /* daha fazla dikey alan */
  border-radius: 8px;
  object-fit: contain;
  transition: opacity 0.3s ease;
}

.modal p {
  margin-top: 16px;
  color: #fff;
  font-size: 16px;
  text-align: center;
}

.modal img:hover {
  transform: scale(1.02);
}

.close-btn {
  margin-top: 0px;
  padding: 10px 20px;
  background-color: #0077cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  z-index: 1000; /* diğer içeriklerin üstünde kalır */
}

</style>