import supabase from '@/services/supabaseService.js';

function getTableName() {
  const raw = localStorage.getItem('companyName') || 'default';
  return raw.startsWith('dates_') ? raw : `dates_${raw}`;
}

export const dateService = {
  async getAll() {
    const tableName = getTableName();
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) console.error(`GET ALL [${tableName}] →`, error.message);
    return data ?? [];
  },

  async insertOne(payload) {
    const tableName = getTableName();
    const { data, error } = await supabase.from(tableName).insert(payload).select();
    if (error) console.error(`INSERT [${tableName}] →`, error.message);
    return data?.[0] ?? null;
  },

  async updateByCompositeKey(meet_id, week_id, updates) {
    const tableName = getTableName();
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .match({ meet_id, week_id })
      .select();
    if (error) console.error(`UPDATE [${tableName}] →`, error.message);
    return data?.[0] ?? null;
  },

  async deleteByCompositeKey(meet_id, week_id) {
    const tableName = getTableName();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .match({ meet_id, week_id });
    if (error) {
      console.error(`DELETE [${tableName}] →`, error.message);
      return false;
    }
    return true;
  }
};