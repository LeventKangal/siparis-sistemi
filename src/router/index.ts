import { createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'

// Views
import LoginView from '@/views/LoginView.vue'
import PageInfo from '@/PageInfo.vue'
import PageAbout from '@/PageAbout.vue'
import DashboardView from '@/views/DashboardView.vue'

// Orders
import OrderEntry from '@/components/orders/OrderEntry.vue'
import ProductSearchOrder from '@/components/orders/ProductSearchOrder.vue'
import OrderList from '@/components/orders/OrderList.vue'
import OrderExport from '@/components/orders/OrderExport.vue'
import OrderUpdate from '@/components/orders/OrderUpdate.vue'
import OrderDelete from '@/components/orders/OrderDelete.vue'


// Suppliers
import OrderListSupplier from '@/components/suppliers/OrderListSupplier.vue'
import OrderListPdf from '@/components/suppliers/OrderListPdf.vue'
import OrderCustomerListPdf from '@/components/suppliers/OrderCustomerListPdf.vue'
import ProductManager from '@/components/suppliers/ProductManager.vue'
import OrderListSupplierSorted from '@/components/suppliers/OrderListSupplierSorted.vue'
import OrderSummary from '@/components/suppliers/OrderSummary.vue'
import ProductOrder from '@/components/suppliers/ProductOrder.vue'
import SupplierProfileForm from '@/components/suppliers/SupplierProfileForm.vue'
import WeekSummary from '@/components/suppliers/WeekSummary.vue'
import SupplierDashboard from '@/components/suppliers/SupplierDashboard.vue'


// DB
import UserManager from '@/components/db/UserManager.vue'
import SupplierManager from '@/components/db/SupplierManager.vue'
import DateManager from '@/components/db/DateManager.vue'
import RateManager from '@/components/db/RateManager.vue'
import ProductManagerAdmin from '@/components/db/ProductManagerAdmin.vue'
import CargoManager from '@/components/db/CargoManager.vue'
import CargoProcessor from '@/components/db/CargoProcessor.vue'
import LogViewer from '@/components/db/LogViewer.vue'
import TotalListManager from '@/components/db/TotalListManager.vue'


// KS
import KsLayout from '@/layouts/KsLayout.vue'
import KasaEntry from '@/components/ks/KasaEntry.vue'
//import KasaAdd from '@/components/ks/KasaAdd.vue'
import KasaGive from '@/components/ks/KasaGive.vue'
import KasaSummary from '@/components/ks/KasaSummary.vue'
//import KasaUpdate from '@/components/ks/KasaUpdate.vue'
//import KasaDelete from '@/components/ks/KasaDelete.vue'
import OrderSummaryManager from '@/components/ks/OrderSummaryManager.vue'
import KasaEftList from '@/components/ks/KasaEftList.vue'
import KasaEftListU from '@/components/ks/KasaEftListU.vue'

import ResetScheduleView from '@/cron/ResetScheduleView.vue'
import ResetLogsView from '@/cron/ResetLogsView.vue';
import RestoreStockView from '@/cron/RestoreStockView.vue';  

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login', name: 'root'},
  { path: '/login', name: 'login', component: LoginView},
  { path: '/info', name: 'info', component: PageInfo},
  { path: '/about', name: 'about', component: PageAbout},
  { path: '/dashboard', name: 'dashboard', component: DashboardView},
  
   { path: '/reset-schedule', name: 'KapamaTanım', component: ResetScheduleView},
   { path: '/reset-logs', name: 'IslemGecmisi', component: ResetLogsView},
   { path: '/restore-stock', name: 'StokGeriYukleme', component: RestoreStockView},

  {
    path: '/orders',
    name: 'orders',
    children: [
      { path: 'entry', name: 'order-entry', component: OrderEntry},
      { path: 'search', name: 'order-search', component: ProductSearchOrder},
      { path: 'list', name: 'order-list', component: OrderList},
      { path: 'export', name: 'order-export', component: OrderExport},
      { path: 'update', name: 'order-update', component: OrderUpdate},
      { path: 'delete', name: 'order-delete', component: OrderDelete}
    ]
},

  {
    path: '/db',
    name: 'db',
    children: [
      { path: 'users', name: 'db-entry', component: UserManager},
      { path: 'supplier', name: 'db-supplier', component: SupplierManager},
      { path: 'date', name: 'db-date', component: DateManager},
      { path: 'rates', name: 'db-rates', component: RateManager},
      { path: 'productAdmin', name: 'db-product', component: ProductManagerAdmin},
      { path: 'cargo', name: 'db-cargo', component: CargoManager},
      { path: 'cargoP', name: 'db-cargoP', component: CargoProcessor},
      { path: 'logview', name: 'db-logview', component: LogViewer},
      { path: 'TotalList', name: 'db-totallist', component: TotalListManager}
      

    ]
},

  {
    path: '/suppliers',
    name: 'suppliers',
    children: [
      { path: 'product', name: 'ProductManager', component: ProductManager},
      { path: 'orders', name: 'OrderListSupplier', component: OrderListSupplier},
      { path: 'customer', name: 'OrderCustomerListPdf', component: OrderCustomerListPdf},
      { path: 'sorted', name: 'OrderListSupplierSorted', component: OrderListSupplierSorted},
      { path: 'print', name: 'OrderListPdf', component: OrderListPdf},
      { path: 'summary', name: 'OrderSummary', component: OrderSummary},
      { path: 'sort', name: 'ProductOrder', component: ProductOrder},
      { path: 'form', name: 'SupplierProfile', component: SupplierProfileForm},
      { path: 'weeksummary', name: 'WeekSummary', component: WeekSummary},
      { path: 'Dashboard', name: 'Dashboard', component: SupplierDashboard}

    ]
},

  {
  path: '/ks',
  name: 'ks',
  component: KsLayout, // 🔥 Önemli kısmı burası!
  children: [
    { path: 'take', name: 'KasaEntry', component: KasaEntry},
    { path: 'give', name: 'KasaGive', component: KasaGive},
    { path: 'summary', name: 'KasaSummary', component: KasaSummary},
    { path: 'payment', name: 'OrderSummaryManager', component: OrderSummaryManager},
    { path: 'eft', name: 'KasaEftList', component: KasaEftList},
    { path: 'eft1', name: 'KasaEftListU', component: KasaEftListU}
  ]
}

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Basit authentication guard (isteğe bağlı)
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('userName')
  if (!isAuthenticated && to.path!== '/login') {
    next('/login')
} else {
    next()
}
})

export default router