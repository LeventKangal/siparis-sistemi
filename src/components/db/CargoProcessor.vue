<template>
  <div class="cargo-processor">
    <h3>Kargo İşlemleri</h3>
    <button @click="processCargos":disabled="loading">
      {{ loading? 'İşleniyor...': 'Kargoları İşle'}}
    </button>

    <p v-if="message">{{ message}}</p>

    <table v-if="report.length> 0">
      <thead>
        <tr>
          <th>Tüketici</th>
          <th>Üretici</th>
          <th>Meet ID</th>
          <th>Ürün</th>
          <th>Miktar</th>
          <th>Birim Fiyat</th>
          <th>Toplam</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in report":key="index">
          <td>{{ entry.user_name}}</td>
          <td>{{ entry.supplier_name}}</td>
          <td>{{ entry.meet_id}}</td>
          <td>{{ entry.product_name}}</td>
          <td>{{ entry.quantity}}</td>
          <td>{{ entry.unit_price?.toFixed(2)?? '-'}}</td>
          <td>{{ entry.total_price?.toFixed(2)?? '-'}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref} from 'vue'
import supabase from '@/services/supabaseService'

const loading = ref(false)
const message = ref('')
const report = ref<
  {
    user_name: string
    supplier_name: string
    meet_id: string
    product_name: string
    quantity: number
    unit_price: number | null
    total_price: number | null
}[]
>([])

function getCompanyName(): string {
  return localStorage.getItem('companyName')?.trim() || ''
}

async function processCargos() {
  loading.value = true
  message.value = ''
  report.value = []

  const company = getCompanyName()

  const { data: cargos, error: cargoError} = await supabase
.from(`cargo_${company}`)
.select('*')
.eq('isReady', true)

  if (cargoError ||!cargos || cargos.length === 0) {
    message.value = 'İşlenecek kargo bulunamadı.'
    loading.value = false
    return
}

  for (const cargo of cargos) {
    const supplierId = cargo.supplier_id
    const productId = cargo.product_id
    const meetId = cargo.meet_id
    const totalCharge = cargo.total_charge?? 0

    const { data: supplier} = await supabase
.from(`suppliers_${company}`)
.select('name')
.eq('id', supplierId)
.single()

    const { data: product} = await supabase
.from(`products_${company}`)
.select('name')
.eq('id', productId)
.single()

    const { data: orderItems} = await supabase
.from(`order_items_${company}`)
.select('*')
.eq('meet_id', meetId)
.eq('supplier_id', supplierId)

    if (!orderItems || orderItems.length === 0) continue

    const consumerMap = new Map<string, number>()

    for (const item of orderItems) {
      const { data: productData} = await supabase
.from(`products_${company}`)
.select('cargo_quantity')
.eq('id', item.product_id)
.single()

      const cargoQty = productData?.cargo_quantity?? 0
      const itemQty = item.quantity?? 0
      const cargoAmount = cargoQty * itemQty

      if (cargoAmount> 0) {
 const prev = consumerMap.get(item.user_mail)?? 0
        consumerMap.set(item.user_mail, prev + cargoAmount)
}
}

    const totalUnit = Array.from(consumerMap.values()).reduce((a, b) => a + b, 0)
    const unitCharge = totalUnit> 0? totalCharge / totalUnit: null

    // ✅ Cargo tablosunu güncelle
    const { error: updateError} = await supabase
.from(`cargo_${company}`)
.update({
        total_unit: totalUnit,
        unit_charge: unitCharge,
        total_charge: totalCharge
})
.eq('supplier_id', supplierId)
.eq('meet_id', meetId)

    if (updateError) console.warn('Cargo güncellemesi başarısız:', updateError)

    for (const [email, quantity] of consumerMap.entries()) {
      const { data: user} = await supabase
.from(`users_${company}`)
.select('name')
.eq('email', email)
.single()

      await supabase
.from(`order_items_${company}`)
.insert([
          {
            user_mail: email,
            supplier_id: supplierId,
            product_id: productId,
            meet_id: meetId,
            quantity,
            price: unitCharge,
            description: 'Kargo ile otomatik giriş',
            name : product?.name
}
        ])

      report.value.push({
        user_name: user?.name?? email,
        supplier_name: supplier?.name?? String(supplierId),
        meet_id: meetId,
        product_name: product?.name?? String(productId),
        quantity,
        unit_price: unitCharge,
        total_price: unitCharge? unitCharge * quantity: null
})
}
}

  message.value = 'Tüm kargolar başarıyla işlendi.'
  loading.value = false
}
</script>

<style scoped>
.cargo-processor {
  padding: 20px;
}
table {
  margin-top: 20px;
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
}
th {
  background-color: #f0f0f0;
}
</style>


