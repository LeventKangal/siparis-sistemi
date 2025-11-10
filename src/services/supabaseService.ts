import { createClient} from '@supabase/supabase-js'

// Supabase projenizden alınan URL ve public anahtar
const supabaseUrl = "https://fgefubfhzrkibyglnilu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZWZ1YmZoenJraWJ5Z2xuaWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU1MzIyMiwiZXhwIjoyMDY0MTI5MjIyfQ.xbpgr1qOstPTlTxs19EtlyUMEsv2RjymmTWl8aejQ9s"; // Gerçek API anahtarınızı buraya ekleyin

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase