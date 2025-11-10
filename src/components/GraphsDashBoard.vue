<template>
  <div class="dashboard">
    <h2>Genel Dağıtım Grafikleri</h2>

    <label for="meetSelect">Toplantı Seç:</label>
    <select id="meetSelect" v-model="selectedMeet">
      <option v-for="option in meetOptions":key="option.label":value="option">
        {{ option.label}}
      </option>
    </select>

    <TopUsersBarChart :meet="selectedMeet" />
    <ProductPieChart :meet="selectedMeet" />
    <RevenueLineChart :meet="selectedMeet" />
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import supabase from '@/services/supabaseService.js';

import TopUsersBarChart from '@/components/charts/TopUsersBarChart.vue';
import ProductPieChart from '@/components/charts/ProductPieChart.vue';
import RevenueLineChart from '@/components/charts/RevenueLineChart.vue';

const selectedMeet = ref(null);
const meetOptions = ref([]);

const company = localStorage.getItem('companyName');

onMounted(async () => {
  const { data, error} = await supabase
.from(`dates_${company}`)
.select('meet_id, week_id');

  if (error) {
    console.error('Toplantı verisi alınamadı:', error);
    return;
}

  meetOptions.value = data.map(item => ({
    label: `${item.meet_id} - ${item.week_id}`,
    meetId: item.meet_id,
    weekId: item.week_id
}));

  selectedMeet.value = meetOptions.value[0] || null;
});
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

select {
  padding: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}
</style>