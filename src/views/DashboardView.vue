<template>
  <div>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import TopBar from '@/components/TopBar.vue';
</script>

<style scoped>
.content {
  padding: 20px;
  margin-top: 112px; /* UnifiedHeader + TopBar yüksekliği */
  box-sizing: border-box;
}
</style>