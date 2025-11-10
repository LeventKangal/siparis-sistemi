<template>
  <div>
    <h2>Toplantı Seçimi</h2>
    <select v-model="selectedMeetId" @change="fetchOrders">
      <option disabled value="">Bir toplantı seçin</option>
      <option v-for="id in meetIds":key="id":value="id">{{ id}}</option>
    </select>
    <div v-if="isLoading" class="loading-indicator">
  <span class="spinner"></span> İşleniyor, lütfen bekleyin...
    </div>
    <button @click="exportToCSV">CSV'e Aktar</button>
    <button @click="exportToExcel">Excel'e Aktar</button>

    <div v-if="groupedData && Object.keys(groupedData).length">
      <div v-for="(products, supplier) in groupedData":key="supplier">
        <table>
          <thead>
            <tr>
              <th style="width: 120px; text-align: left;">Ürün</th>
              <th style="width: 80px;">Birim</th>
              <th style="width: 100px; text-align: right;">Fiyat ₺</th>
              <th v-for="user in users":key="user" style="width: 100px; text-align: center;">{{ user}}</th>
              <th style="width: 100px;">Toplam Adet</th>
              <th style="width: 120px;">Toplam Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr class="highlighted-row">
              <td colspan="3" style="text-align: left;"><strong>{{ supplier}}</strong></td>
              <td :colspan="users.length"></td>
              <td></td>
              <td>{{ formatPrice(Object.values(products).reduce((sum, p) => sum + p.totalPrice, 0))}} ₺</td>
            </tr>
            <tr v-for="(details, product) in products":key="product">
              <td style="text-align: left;">{{ product}}</td>
              <td>{{ details.unit}}</td>
              <td style="text-align: right;">{{ formatPrice(details.price)}} ₺</td>
              <td v-for="user in users":key="user">
                {{formatPrice(details.userQuantities[user]) || ''}}
              </td>
              <td>{{ formatPrice(details.totalQuantity)}}</td>
              <td>{{ formatPrice(details.totalPrice)}} ₺</td>
            </tr>
          </tbody>
          </table>
          
</div>
      <!-- Genel toplamlar -->
  <table>
    <tfoot>
      <tr>
  <td></td><td></td><td><strong>ARA TOPLAM</strong></td>
  <td v-for="user in users":key="user">{{ formatPrice(userTotals[user] || 0)}} ₺</td>
  <td></td>
  <td><strong>{{ formatPrice(totalAmount)}} ₺</strong></td> <!-- ✅ Satır toplamı -->
</tr>

<tr>
  <td></td><td></td><td><strong>KASA PAYI</strong></td>
  <td v-for="user in users":key="user">{{ formatPrice(userKasaPayi[user] || 0)}} ₺</td>
  <td></td>
  <td><strong>{{ formatPrice(totalKasaPayi)}} ₺</strong></td> <!-- ✅ Satır toplamı -->
</tr>

<tr>
  <td></td><td></td><td><strong>GENEL TOPLAM</strong></td>
  <td v-for="user in users":key="user">{{ formatPrice(userGenelToplam[user] || 0)}} ₺</td>
  <td></td>
  <td><strong>{{ formatPrice(totalGenelToplam)}} ₺</strong></td> <!-- ✅ Satır toplamı -->
</tr>
    </tfoot>
  </table>
    </div>
  </div>
</template>

<script>
import supabase from '@/services/supabaseService';
import { formatPrice} from '@/utils/formatters';
import { fetchRateForAmount} from '@/services/rateService';
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      isLoading: false,  
      company: localStorage.getItem('companyName')?.trim() || '',
      meetIds: [],
      selectedMeetId: '',
      orders: [],
      rates: [],
      users: [],
      groupedData: {},
      totalAmount: 0,
      totalKasaPayi: 0,
      genelToplam: 0,
      userTotals: {},
      userKasaPayi: {},
      userGenelToplam: {}, 
      totalGenelToplam: 0  
};
},
  async mounted() {
    await this.fetchMeetIds();
    await this.fetchRates();
    if (this.selectedMeetId) {
      await this.fetchOrders();
}
},
  methods: {
    formatPrice(value) {
      return formatPrice(value);
},

    async fetchMeetIds() {
      const { data, error} = await supabase
.from(`dates_${this.company}`)
.select('meet_id')
.order('created_at', { ascending: false});

      if (!error) this.meetIds = [...new Set(data.map(d => d.meet_id))];
},

    async fetchRates() {
      const { data, error} = await supabase
.from(`rates_${this.company}`)
.select('*');

      if (!error) this.rates = data;
},

    async fetchOrders() {
      this.isLoading = true;  
      const { data, error} = await supabase
.from(`order_items_${this.company}`)
.select(`
          quantity,
          price,
          meet_id,
          user_mail,
          product_id,
          supplier_id,
          products:product_id (name, unit),
          suppliers:supplier_id (supplier_name),
          users:user_mail (name)
        `)
.eq('meet_id', this.selectedMeetId);

      if (!error) {
        this.orders = data;
        this.users = [...new Set(data.map(o => o.users?.name))].sort();
        this.groupedData = this.groupOrders(data);
        await this.calculateTotals(data);
}
},

    groupOrders(orders) {
      const grouped = {};
      orders.forEach(order => {
        const supplier = order.suppliers?.supplier_name || 'Bilinmeyen';
        const product = order.products?.name;
        const unit = order.products?.unit;
        const price = order.price;
        const user = order.users?.name;
        const quantity = order.quantity;

        if (!grouped[supplier]) grouped[supplier] = {};
        if (!grouped[supplier][product]) {
          grouped[supplier][product] = {
            unit,
            price,
            userQuantities: {},
            totalQuantity: 0,
            totalPrice: 0
};
}

        grouped[supplier][product].userQuantities[user] = quantity;
        grouped[supplier][product].totalQuantity += quantity;
        grouped[supplier][product].totalPrice += quantity * price;
});
      return grouped;
},

    async calculateTotals(orders) {
      this.totalAmount = orders.reduce((sum, o) => sum + o.quantity * o.price, 0);

      const userTotals = {};
      orders.forEach(o => {
        const user = o.users?.name;
        const amount = o.quantity * o.price;
        if (!userTotals[user]) userTotals[user] = 0;
        userTotals[user] += amount;
});
      this.userTotals = userTotals;
      
      const totalKasaPayi = {};
      const kasaPayiObj = {};
      for (const user of this.users) {
        const amount = userTotals[user] || 0;
        const rate = await fetchRateForAmount(amount);
        kasaPayiObj[user] = rate; 
    // Toplam kasa payı
    this.totalKasaPayi = Object.values(kasaPayiObj).reduce((sum, val) => sum + val, 0);
   // totalKasaPayi[user] = (totalKasaPayi[user] || 0) + (kasaPayiObj[user] || 0);    
}

      this.userKasaPayi = kasaPayiObj;

      const userGenelToplam = {};
for (const user of this.users) {
  userGenelToplam[user] = (userTotals[user] || 0) + (kasaPayiObj[user] || 0);
}
      this.userGenelToplam = userGenelToplam;
      this.totalGenelToplam = Object.values(userGenelToplam).reduce((sum, val) => sum + val, 0);
   
      this.isLoading = false;
},

    exportToCSV() {
      let csv = 'Ürün,Birim,Fiyat,' + this.users.join(',') + ',Toplam Adet,Toplam Tutar\n';

      Object.entries(this.groupedData).forEach(([supplier, products]) => {
        const supplierTotal = Object.values(products).reduce((sum, p) => sum + p.totalPrice, 0);
        csv += `${supplier},,,,,,${supplierTotal.toFixed(2)} ₺\n`;

        Object.entries(products).forEach(([product, details]) => {
          const row = [
            product,
            details.unit,
            details.price,
...this.users.map(u => details.userQuantities[u] || ''),
            details.totalQuantity,
            details.totalPrice.toFixed(2)
          ];
          csv += row.join(',') + '\n';
});
});

      csv += 'ARA TOPLAM,,,' + this.users.map(u => formatPrice(this.userTotals[u] || 0)).join(',') + ',,\n';
      csv += 'KASA PAYI,,,' + this.users.map(u => formatPrice(this.userKasaPayi[u] || 0)).join(',') + ',,\n';

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'siparisler.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
},

    exportToExcel() {
      const worksheetData = [];

      Object.entries(this.groupedData).forEach(([supplier, products]) => {
        const supplierTotal = Object.values(products).reduce((sum, p) => sum + p.totalPrice, 0);
        worksheetData.push([`${supplier}`, '', '', '', '', '', supplierTotal.toFixed(2)]);

        worksheetData.push(['Ürün', 'Birim', 'Fiyat',...this.users, 'Toplam Adet', 'Toplam Tutar']);

        Object.entries(products).forEach(([product, details]) => {
          const row = [
            product,
            details.unit,
            details.price,
...this.users.map(u => details.userQuantities[u] || ''),
            details.totalQuantity,
            details.totalPrice.toFixed(2)
          ];
          worksheetData.push(row);
});
        
        worksheetData.push([]);
});

      // 🔢 Genel toplamlar bölümü
  worksheetData.push(['', '', 'ARA TOPLAM',...this.users.map(u => this.formatPrice(this.userTotals[u] || 0)), '', this.formatPrice(this.totalAmount)]);
  worksheetData.push(['', '', 'KASA PAYI',...this.users.map(u => this.formatPrice(this.userKasaPayi[u] || 0)), '', this.formatPrice(this.totalKasaPayi)]);
  worksheetData.push(['', '', 'GENEL TOPLAM',...this.users.map(u => this.formatPrice(this.userGenelToplam[u] || 0)), '', this.formatPrice(this.totalGenelToplam)]);

  // Excel dosyasını oluştur
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sipariş Özeti');

  XLSX.writeFile(workbook, 'siparis_ozeti.xlsx');
}
}
};
</script>



<style scoped>
h2  {
  color: blue;
  font-weight: normal;
  margin-left: 0; /* Tabloyla hizalanması için */
  margin-top: 35px;
  padding-left: 0;
}
table {
  table-layout: fixed;  
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 2rem;
}
th, td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: center;
  border: 1px solid #ccc;
}
tfoot td {
  background-color: #f9f9f9;
  font-weight: bold;
}
.highlighted-row {
  background-color: #f0f8ff; /* Açık mavi ton */
  font-weight: bold;
  text-align: left;
}
tfoot tr {
  background-color: #f9f9f9;
  font-weight: bold;
}
tfoot tr:nth-child(3) {
  background-color: #e0ffe0; /* Açık yeşil ton */
  font-weight: bold;
}
.loading-indicator {
  text-align: center;
  margin: 1rem 0;
  font-weight: bold;
  color: #555;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 3px solid #ccc;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg);}
}

</style>