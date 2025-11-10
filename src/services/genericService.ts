import supabase from '@/services/supabaseService.js'

export function getCompanyTable(baseTable: string): string {
  const company = localStorage.getItem('companyName')?.trim() || ''
  return `${baseTable}_${company}`
}

export function createGenericService<T>(
  baseTableName: string,
  idFields: string | string[]
) {
  const getTable = () => getCompanyTable(baseTableName)

  
  const applyFilters = (query: any, id: any) => {
    if (Array.isArray(idFields)) {
      idFields.forEach((field, i) => {
        query = query.eq(field, id[i])
})
} else {
      query = query.eq(idFields, id)
}
    return query
}

  return {
    async getAll(): Promise<T[]> {
      const { data, error} = await supabase.from(getTable()).select('*')
      if (error) throw error
      return data || []
},

    async insertOne(payload: Partial<T>): Promise<T | null> {
      const { data, error} = await supabase
.from(getTable())
.insert([payload])
.select()
      if (error) throw error
      return data?.[0] || null
},

    async updateById(id: any, updates: Partial<T>): Promise<T | null> {
      let query = supabase.from(getTable()).update(updates)
      query = applyFilters(query, id)
      const { data, error} = await query.select()
      if (error) throw error
      return data?.[0] || null
},

    async deleteById(id: any): Promise<boolean> {
      let query = supabase.from(getTable()).delete()
      query = applyFilters(query, id)
      const { error} = await query
      return!error
}
}
}