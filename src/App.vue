<template>
  <div class="app-container">
    <UnifiedHeader v-if="route.path!== '/login'" />
    <TopBar v-if="route.path!== '/login'" />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useRoute} from 'vue-router';
import UnifiedHeader from '@/components/UnifiedHeader.vue';
import TopBar from '@/components/TopBar.vue';

const route = useRoute();
</script>

<style scoped>
.main-content {
  margin-top: 50px; /* Barların toplam yüksekliği */
  padding: 24px;
  box-sizing: border-box;
}
</style>
