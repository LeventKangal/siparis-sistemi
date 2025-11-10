import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


  const supabase = createClient(
    'https://fgefubfhzrkibyglnilu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZWZ1YmZoenJraWJ5Z2xuaWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU1MzIyMiwiZXhwIjoyMDY0MTI5MjIyfQ.xbpgr1qOstPTlTxs19EtlyUMEsv2RjymmTWl8aejQ9s');

  serve(async (req) => {
  const now = new Date();
  const nowTR = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));

  const currentDay = nowTR.toLocaleString('en-US', { weekday: 'long' }); // örn: "Monday"
  const currentTime = nowTR.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }); // örn: "20:45"
  const isoNow = now.toISOString();

  // 1. Aktif zamanlamaları çek
  const { data: schedules, error: scheduleError } = await supabase
    .from('reset_schedule')
    .select('*')
    .eq('active', true);

  if (scheduleError || !schedules?.length) {
    return new Response('No active schedules found.', { status: 200 });
  }

  for (const item of schedules) {
    const { id, company_name, supplier_id, reset_day, reset_time, last_reset_at, reset_count } = item;

    // 2. Gün ve saat eşleşmiyorsa atla
   // if (reset_day !== currentDay || reset_time !== currentTime) continue;

    // 3. Aynı gün zaten sıfırlandıysa atla
    if (last_reset_at) {
      const last = new Date(last_reset_at);
      const alreadyResetToday = last.toLocaleDateString('tr-TR') === nowTR.toLocaleDateString('tr-TR');
      if (alreadyResetToday) continue;
    }

    // 4. Ürünleri çek
    const { data: products, error: fetchError } = await supabase
      .from(`products_${company_name}`)
      .select('id, stock, supplier_id')
      .eq('supplier_id', String(supplier_id));

    if (fetchError || !products?.length) continue;

    // 5. Yedekle
    const backupData = products.map(p => ({
      product_id: p.id,
      supplier_id: p.supplier_id,
      original_stock: p.stock,
      company_name,
      backup_date: isoNow
    }));

    await supabase.from('stock_backups').insert(backupData);

    // 6. Sıfırla
    await supabase
      .from(`products_${company_name}`)
      .update({ stock: 0 })
      .eq('supplier_id', supplier_id);

    // 7. Logla
    await supabase.from('reset_logs').insert({
      schedule_id: id,
      company_name,
      supplier_id,
      status: 'success',
      message: 'Otomatik sıfırlama tamamlandı',
      action_type: 'reset',
      timestamp: isoNow
    });

    // 8. Zamanlamayı güncelle
    await supabase
      .from('reset_schedule')
      .update({
        last_reset_at: isoNow,
        reset_count: (reset_count ?? 0) + 1,
        triggered_by: 'cron'
      })
      .eq('id', id);
  }

  return new Response('✅ Otomatik sıfırlama tamamlandı', { status: 200 });
});

