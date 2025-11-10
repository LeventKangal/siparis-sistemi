<template>
  <Pie v-if="chartDataReady":data="chartData":options="chartOptions" class="canvas" />
</template>

<script setup>
import { ref, watchEffect} from 'vue';
import { Pie} from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement);

import supabase from '@/services/supabaseService.js';

const props = defineProps({ meet: Object});
const chartDataReady = ref(false);

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Ürün Dağılımı',
    data: [],
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0']
}]
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom'},
    title: { display: true, text: 'Siparişe Göre Ürün Dağılımı'}
}
};

watchEffect(async () => {
  if (!props.meet?.meetId) return;

  const company = localStorage.getItem('companyName');
  const { data, error} = await supabase
.from(`order_items_${company}`)
.select('name, quantity')
.eq('meet_id', props.meet.meetId);

  if (error ||!data) {
    console.error('Veri alınamadı:', error);
    chartDataReady.value = false;
    return;
}

  const totals = {};
  data.forEach(item => {
    if (!item.product_name ||!item.quantity) return;
    totals[item.product_name] = (totals[item.product_name] || 0) + item.quantity;
});

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  chartData.value.labels = sorted.map(([name]) => name);
  chartData.value.datasets[0].data = sorted.map(([_, qty]) => qty);
  chartDataReady.value = true;
});
</script>

<style scoped>
.canvas {
  max-height: 400px;
}
</style>