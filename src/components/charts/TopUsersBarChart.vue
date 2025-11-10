<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { defineProps, watch} from 'vue';
import { ref} from 'vue';
import { Bar} from 'vue-chartjs';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(Filler, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

import supabase from '@/services/supabaseService.js';

const props = defineProps({
  meet: {
    type: Object,
    required: true
}
});

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'Sipariş Tutarı (₺)',
    data: [],
    backgroundColor: '#42A5F5',
    fill: true
}]
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top'},
    title: { display: true, text: 'En Çok Sipariş Veren Kullanıcılar'}
}
};

watch(() => props.meet, async (newMeet) => {
  if (!newMeet?.meetId) return;

  const company = localStorage.getItem('companyName');

  const { data, error} = await supabase
.from(`order_items_${company}`)
.select('user_mail, quantity, price')
.eq('meet_id', newMeet.meetId);

  if (error) {
    console.error('Veri çekme hatası:', error);
    return;
}

  const totals = {};
  data.forEach(item => {
    if (!item.quantity ||!item.price) return;
    const key = item.user_mail;
    const value = item.quantity * item.price;
    totals[key] = (totals[key] || 0) + value;
});

  const sorted = Object.entries(totals)
.sort((a, b) => b[1] - a[1])
.slice(0, 5);

  chartData.value.labels = sorted.map(([mail]) => mail);
  chartData.value.datasets[0].data = sorted.map(([_, total]) => total);
}, { immediate: true});
</script>