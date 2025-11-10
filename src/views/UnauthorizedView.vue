<template>
  <div class="unauthorized">
    <h2>🚫 Erişim Engellendi</h2>
    <p>Bu sayfaya erişim izniniz yok.</p>
    <button @click="$router.push('/dashboard')">Geri Dön</button>
  </div>
</template>

<style scoped>
.unauthorized {
  text-align: center;
  margin-top: 50px;
}
</style>