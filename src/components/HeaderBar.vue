<template>
  <div class="headerbar">
    <img :src="logoPath" alt="Logo" class="logo" />
    <span class="company-name">Sipariş Sistemi</span>
  </div>
</template>

<script setup>
const companyName = localStorage.getItem('companyName') || 'Company';


// Logo yolu dinamik olarak oluşturuluyor
const logoPath = new URL(`../assets/${companyName}.png`, import.meta.url).href;
</script>

<style scoped>
.headerbar {
  background-color: #0d47a1;
  color: white;
  text-align: center;
  padding: 10px 0;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.logo {
  height: 32px;
  width: auto;
}

.company-name {
  font-size: 18px;
}
</style>
