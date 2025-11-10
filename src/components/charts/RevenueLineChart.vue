<template>
  <Line v-if="chartDataReady":data="chartData":options="chartOptions" class="canvas" />
</template>

<script setup>
import { ref, watchEffect} from 'vue';
import { Line} from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  LineElement, PointElement, CategoryScale, LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

import supabase from '@/services/supabaseService.js';

const props = defineProps({ meet: Object});
const chartDataReady = ref(false);

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Toplam Sipariş Tutarı (₺)',
    data: [],
    borderColor: '#FF6384',
    backgroundColor: 'rgba(255,99,132,0.2)',
    tension: 0.4,
    fill: true
}]
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top'},
    title: { display: true, text: 'Toplantıya Göre Sipariş Geliri'}
}
};

watchEffect(async () => {
  if (!props.meet?.meetId) return;

  const company = localStorage.getItem('companyName');
  const { data, error} = await supabase
.from(`order_items_${company}`)
.select('created_at, quantity, price')
.eq('meet_id', props.meet.meetId);

  if (error ||!data) {
    console.error('Veri alınamadı:', error);
    chartDataReady.value = false;
    return;
}

  const dailyTotals = {};
  data.forEach(item => {
    if (!item.created_at ||!item.quantity ||!item.price) return;
    const date = item.created_at.split('T')[0];
    const value = item.quantity * item.price;
    dailyTotals[date] = (dailyTotals[date] || 0) + value;
});

  const sorted = Object.entries(dailyTotals).sort(([a], [b]) => new Date(a) - new Date(b));
  chartData.value.labels = sorted.map(([date]) => date);
  chartData.value.datasets[0].data = sorted.map(([_, total]) => total);
  chartDataReady.value = true;
});
</script>

<style scoped>
.canvas {
  max-height: 400px;
}
</style>