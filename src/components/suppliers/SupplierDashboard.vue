<template>
  <div class="dashboard">
    <h2>📊 Üretici Kontrol Paneli</h2>

    <div class="tabs">
      <button
        v-for="tab in tabs"
:key="tab.key"
:class="{ active: activeTab === tab.key}"
        @click="activeTab = tab.key"
>
        {{ tab.label}}
      </button>
    </div>

    <div class="panel-container">
      <component :is="tabComponents[activeTab]" />
    </div>
  </div>
</template>

<script setup>
import { ref} from 'vue';

// Panel bileşenlerini import et
import ProductSalesPanel from './panels/ProductSalesPanel.vue';
import ProductCustomerPanel from './panels/ProductCustomerPanel.vue';
import NewCustomerPanel from './panels/NewCustomerPanel.vue';
import TopCustomersPanel from './panels/TopCustomersPanel.vue';
import MeetDashBoardPanel from './panels/MeetDashBoardPanel.vue';
//import GraphsDashBoard from '@/components/GraphsDashBoard.vue';
// import NewCustomerPanel from './panels/NewCustomerPanel.vue';
// import ProductCustomerPanel from './panels/ProductCustomerPanel.vue';

const tabs = [
  { key: 'productSales', label: '🛫 Ürün Satış Performansı'},
  { key: 'productCustomer', label: '👬🏻 Ürün Bazlı Türetici Listesi'},
  { key: 'newCustomer', label: '🆕 Yeni Kazanılan Türeticiler'},
  { key: 'topCustomer', label: '👑 En Çok Sipariş Verenler'},
  { key: 'weekSummary', label: '📚 Dağıtım Sipariş Analizleri'}
  //{ key: 'graphSummary', label: '📊 Dağıtım Grafik Analizleri'}

 // { key: 'salesByDate', label: '📦 Tarih Bazlı Satışları'}
];

const tabComponents = {
  productSales: ProductSalesPanel,
  productCustomer: ProductCustomerPanel,
  newCustomer: NewCustomerPanel,
  topCustomer: TopCustomersPanel,
  weekSummary: MeetDashBoardPanel,
 // graphSummary: GraphsDashBoard,
//salesByDate: SalesByDatePanel
};

const activeTab = ref('productSales'); // Varsayılan sekme
</script>

<style scoped>

.tabs {              /* Masa Üstü için Yatay boşluk*/
  display: flex;
  gap: 16px; /* Yatay boşluk */
  flex-wrap: wrap;
}
.dashboard h2 {
    margin-top: 45px;
    font-size: 20px;
}

@media (max-width: 768px) {
.tabs {
    flex-direction: column; /* Sekmeleri dikey sırala */
    gap: 12px;               /* Dikey boşluk */
    margin-top: 60px;        /* TopBar’dan uzaklaştır */
}
.tabs button {
    padding: 12px 20px;      /* Yatay boşluğu artır */
    font-size: 16px;
    border-radius: 8px;
}

.dashboard {
  padding-top: 90px;
  padding: 20px;
  max-width: 1200px;
  margin: auto;
}
.dashboard h2 {
    margin-top: 90px;
    font-size: 20px;
}
}
.tabs button.active {
  background-color: #3498db;
  color: white;
  font-weight: bold;
  border-radius: 6px;
}


</style>
