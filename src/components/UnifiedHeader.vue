<template>
  <div class="unified-header">
    <div class="left">
      <img :src="logoPath" alt="Logo" class="logo" />
      <span class="company-name">Sipariş Sistemi</span>
    </div>
    <div class="right">
      <span>👤 {{ userName}}</span>
      <span>🆔 {{ meetId}}</span>
      <span>📅 {{ formattedWeek}}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';

const companyName = localStorage.getItem('companyName') || 'Company';
const logoPath = new URL(`../assets/${companyName}.png`, import.meta.url).href;

const userName = ref('');
const meetId = ref('');
const weekId = ref('');

const formattedWeek = computed(() => {
  if (!weekId.value) return '—'; // boşsa gösterme
  const date = new Date(weekId.value);
  if (isNaN(date.getTime())) return weekId.value; // geçersizse orijinalini göster
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
}).format(date);
});


onMounted(() => {
  userName.value = localStorage.getItem('userName') || 'Bilinmeyen';
  meetId.value = localStorage.getItem('meetId') || 'Yok';
  weekId.value = localStorage.getItem('weekId') || 'Tanımsız';
});
</script>

<style scoped>
.unified-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: #0d47a1;
  color: white;
  padding: 10px 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0;
  border-bottom: none;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.right {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 14px;
}

.logo {
  height: 32px;
  width: auto;
}

.company-name {
  font-size: 24px;
  font-weight: bold;
}

/* 🌐 Mobil uyum için media query */
@media (max-width: 768px) {
.unified-header {
    flex-direction: column;
    padding: 8px 16px;
}

.left,.right {
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
}

.company-name {
    font-size: 18px;
}

.right {
    font-size: 13px;
    gap: 12px;
}

.logo {
    height: 28px;
}
}
</style>
