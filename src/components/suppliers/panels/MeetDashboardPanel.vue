<template>
  <div>
    <input
      v-model="filter"
      placeholder="Dağıtım ID girin"
      class="input"
      style="margin-top: 2rem"
    />
    <table class="table">
      <thead>
        <tr>
          <th style="text-align: left;">Etkinlik (ID - Hafta)</th>
          <th>Türetici Sayısı</th>
          <th>Sipariş Kalemi</th>
          <th style="text-align: right;">Toplam Ciro (₺)</th>
          <th style="text-align: left;">Ürün Sayısı</th>
          <th style="text-align: center;">Üretici Sayısı</th>
          <th style="text-align: left;">Top Türetici</th>
          <th style="text-align: center;">Top Ürün</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredData":key="row.meet_id">
          <td>{{ row.meet_id}} - {{ formatDate(row.week_id)}}</td>
          <td style="text-align: center;">{{ row.participant_count}}</td>
          <td style="text-align: center;">{{row.total_orders}}</td>
          <td style="text-align: right;">{{ formatPrice(row.total_revenue)}}₺</td>
          <td style="text-align: center;">{{ row.product_variety}}</td>
          <td style="text-align: center;">{{row.supplier_count}}</td>
          
          <td>
           <strong>{{ row.top_user_name}}</strong><br />
           <small>{{ row.top_user_email}}</small>
          </td>
          <td style="text-align: center;">{{ row.top_product}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch, onMounted} from 'vue';
import supabase from '@/services/supabaseService.js';
import { formatPrice, formatDate} from '@/utils/formatters';

const data = ref([]);
const filter = ref('');

const fetchData = async () => {
  const company = localStorage.getItem('companyName'); 
  const viewName = `${company}_meet_dashboard`;

  let query = supabase.from(viewName).select('*');

  if (filter.value) {
    query = query.eq('meet_id', filter.value);
}

  const { data: result, error} = await query;

  if (error) {
    console.error('Veri çekme hatası:', error);
} else {
    data.value = result;
}
};

onMounted(fetchData);
watch(filter, fetchData);

const filteredData = ref([]);
watch(data, () => {
  filteredData.value = data.value;
});
</script>

<style scoped>
.input {
  margin-bottom: 1rem;
  padding: 0.5rem;
  width: 300px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 0.75rem;
  border: 1px solid #ccc;
}
</style>