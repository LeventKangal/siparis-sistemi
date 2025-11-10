 <template>
  <div class="kasa-give">
    <h2>Üretici Ödemeleri</h2>

    <!-- 👨‍🌾 Üretici Seçimi -->
    <label>Üretici:</label>
    <select v-model="selectedSupplier" @change="fetchSupplierOrders">
      <option value="">Seçiniz...</option>
      <option v-for="supplier in supplierList":key="supplier.id":value="supplier.id">
        {{ supplier.name}}
      </option>
    </select>

    <div v-if="orders.length> 0">
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Birim</th>
            <th style="text-align: right;">Birim Fiyat</th>
            <th style="text-align: center;">Miktar</th>
            <th style="text-align: right;">Toplam</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in groupedOrders":key="item.name">
            <td>{{ item.name}}</td>
            <td>{{ item.unit}}</td>
            <td style="text-align: right;">{{ formatPrice(item.price)}} ₺</td>
            <td style="text-align: center;">{{ item.quantity}}</td>
            <td style="text-align: right;">{{ formatPrice(item.price * item.quantity)}} ₺</td>
          </tr>
        </tbody>
      </table>

      <h4 style="text-align: right;">
        🌾 Toplam Sipariş Tutarı: {{ formatPrice(totalAmount)}} ₺
      </h4>
       <div v-if="supplierSpentAmount> 0" style="margin-top: 10px;">
  <p>🧾 Bu üretici tüketici olarak {{ formatPrice(supplierSpentAmount)}} ₺ harcama yapmış.</p>
  <p>💰 Net alacak: {{ formatPrice(netReceivable)}} ₺</p>
     </div>

<div v-if="isSplitPayment" style="margin-top: 10px;">
  <div style="display: flex; gap: 12px; margin-bottom: 10px; margin-left: 500px;">
    <div>
      <label>Nakit:</label>
      <input v-model.number="payments.nakit" type="number" />
    </div>
    <div>
      <label>EFT:</label>
      <input v-model.number="payments.eft" type="number" />
    </div>
    <div>
      <label>Kredi:</label>
      <input v-model.number="payments.kredi" type="number" />
    </div>
  </div>
</div>

<div style="margin-top: 10px; margin-left: 600px;">
  <label>
    <input type="checkbox" v-model="isSplitPayment" />
    Parçalı ödeme mi?
  </label>
</div>

      <div style="text-align: right; margin-top: 20px;">
        <label for="paymentType">Ödeme Türü:</label>
        <select id="paymentType" v-model="paymentType" style="margin-left: 10px; padding: 6px;">
          <option value="nakit">Nakit</option>
          <option value="eft">EFT</option>
          <option value="kredi">Kredi Kartı</option>
        </select>

        <button @click="submitPayment" style="margin-left: 10px; padding: 10px 20px;">
          💳 Ödeme Yapıldı
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch} from 'vue'
import supabase from '@/services/supabaseService'
import { formatPrice} from '@/utils/formatters'

const supplierList = ref([])
const selectedSupplier = ref('')
const orders = ref([])
const meetId = localStorage.getItem('meetId') || ''
const companyName = localStorage.getItem('companyName') || ''
const paymentType = ref('nakit')
const isSplitPayment = ref(false)
const supplierSpentAmount = ref(0)

const netReceivable = computed(() =>
  totalAmount.value - supplierSpentAmount.value
)

const payments = ref({
  nakit: 0,
  eft: 0,
  kredi: 0
})

// 📥 Üretici listesini getir
async function fetchSuppliers() {
  const { data: orderedItems} = await supabase
.from(`order_items_${companyName}`)
.select('supplier_id', { distinct: true})
.eq('meet_id', meetId)

  const orderedSupplierIds = (orderedItems || [])
.map(i => i.supplier_id)
.filter(Boolean)

  const { data: paidOrders} = await supabase
.from(`orders_${companyName}`)
.select('name, user_type')
.eq('meet_id', meetId)
.eq('isChecked', true)

  // 🔹 Tüketici ödemelerini ayır
  const paidNames = (paidOrders || [])
.filter(o => o.user_type!== 'T') // Sadece üretici ödemeleri filtrelensin
.map(o => o.name);


  const { data: allSuppliers, error: supplierError} = await supabase
.from(`suppliers_${companyName}`)
.select('id, name, email')
.order('name', { ascending: true})

  if (supplierError ||!allSuppliers) {
    console.error('❌ Üretici listesi alınamadı:', supplierError)
    supplierList.value = []
    return
}

  supplierList.value = allSuppliers.filter(
    s => orderedSupplierIds.includes(s.id) &&!paidNames.includes(s.name)
)
}

// 📦 Üreticiye ait siparişleri getir
  async function fetchSupplierOrders() {
  if (!selectedSupplier.value || !meetId) return

  const { data, error } = await supabase
    .from(`order_items_${companyName}`)
    .select('name, description, price, quantity, product_id')
    .eq('supplier_id', selectedSupplier.value)
    .eq('meet_id', meetId)

  if (error || !data) {
    console.error('❌ Siparişler alınamadı:', error)
    orders.value = []
    return
  }

  const filteredOrders = data.filter(i => i.quantity > 0)
  const productIds = filteredOrders.map(i => i.product_id)

  const { data: products, error: productError } = await supabase
    .from(`products_${companyName}`)
    .select('id, unit')
    .in('id', productIds)

  if (productError || !products) {
    console.error('❌ Ürün bilgileri alınamadı:', productError)
    orders.value = []
    return
  }

  const enrichedOrders = filteredOrders.map(item => {
    const product = products.find(p => p.id === item.product_id)
    return {
      ...item,
      unit: product?.unit || ''
    }
  })

  orders.value = enrichedOrders
}

async function fetchSupplierSpentAmount() {
  const supplier = supplierList.value.find(s => s.id === selectedSupplier.value)
  if (!supplier?.email || !meetId) return

  // 1. Tüketici isimlerini çek
  const { data: relatedUsers, error: userError } = await supabase
    .from(`users_${companyName}`)
    .select('name')
    .eq('supplier_mail', supplier.email)

  if (userError || !relatedUsers || relatedUsers.length === 0) {
    supplierSpentAmount.value = 0
    return
  }

  const consumerNames = relatedUsers.map(u => u.name).filter(Boolean)

  // 2. Harcamaları tek sorguda topla
  const { data: payments, error: paymentError } = await supabase
    .from(`orders_${companyName}`)
    .select('payment')
    .eq('meet_id', meetId)
    .in('name', consumerNames)

  if (paymentError || !payments) {
    supplierSpentAmount.value = 0
    return
  }

  supplierSpentAmount.value = payments.reduce((sum, p) => sum + (p.payment || 0), 0)
}



// 💳 Ödeme kaydını Supabase'e yaz
async function submitPayment() {
  if (!selectedSupplier.value ||!meetId || totalAmount.value === 0) {
    alert('⚠️ Geçerli üretici ve sipariş bilgisi gereklidir.')
    return
}

  const selected = supplierList.value.find(s => s.id === selectedSupplier.value)
  const supplierName = selected?.name || 'Bilinmeyen'
  // const supplieremail = selected?.email || 'Bilinmeyen'

  let totalPaid = totalAmount.value

  if (isSplitPayment.value) {
    totalPaid = parseFloat(
      (payments.value.nakit + payments.value.eft + payments.value.kredi).toFixed(2)
)

    const expectedTotal = parseFloat(totalAmount.value.toFixed(2))
    const difference = Math.abs(expectedTotal - totalPaid)

   if (difference> 0.01) {
      alert(`⚠️ Ödenen toplam (${totalPaid}₺), beklenen tutar (${expectedTotal}₺) ile uyuşmuyor.`)
  //    return
}
}

  const payload: Record<string, any> = {
    meet_id: meetId,
    name: supplierName,
    user_type: 'U',
    payment: totalAmount.value,
    payment_type: isSplitPayment.value? 'parçalı': paymentType.value,
    isChecked: true,
    created_at: new Date().toISOString(),
    payment_nakit: payments.value.nakit,
    payment_eft: payments.value.eft,
    payment_kredi: payments.value.kredi
}

  if (!isSplitPayment.value) {
    payload[`payment_${paymentType.value}`] = totalPaid
}

  const { error} = await supabase
.from(`orders_${companyName}`)
.insert([payload])

if (error) {
    console.error('❌ Supabase insert hatası:', error)
    alert('Ödeme kaydı başarısız oldu.')
    return
}

  alert('✅ Ödeme başarıyla kaydedildi!')
  selectedSupplier.value = ''
  orders.value = []
  payments.value = { nakit: 0, eft: 0, kredi: 0}
  isSplitPayment.value = false
  await fetchSuppliers()
}

// 💰 Siparişlerin toplamı
const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

// ✅ Ürün bazında gruplanmış siparişler
interface GroupedItem {
  name: string
  price: number
  quantity: number
  unit: string
}

const groupedOrders = computed(() => {
  const map = new Map<string, GroupedItem>()

  for (const item of orders.value) {
    const key = item.name
    const existing = map.get(key)

    if (existing) {
      existing.quantity += item.quantity
} else {
      map.set(key, {
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit
})
}
}

  return Array.from(map.values()).map(entry => ({
    name: entry.name,
    unit: entry.unit,
    price: entry.price,
    quantity: entry.quantity,
    total: entry.price * entry.quantity
}))
})

onMounted(() => {
  fetchSuppliers()
})

watch(selectedSupplier, async () => {
  await fetchSupplierSpentAmount()
})

</script>

<style scoped>
.kasa-give {
  margin-top: 10px; /* UnifiedHeader + TopBar yüksekliği */
  padding: 19px;
  box-sizing: border-box;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 8px;
  border-bottom: 1px solid #ccc;
}
th:last-child, td:last-child {
  text-align: right;
}
select {
  margin-bottom: 10px;
}
label {
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}
input {
  width: 100px;
  padding: 6px;
}
</style>
