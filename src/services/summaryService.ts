// summaryService.ts

import supabase from '@/services/supabaseService';

export interface MeetSummary {
  meet_id: string;
  participant_count: number;
  total_revenue: number;
}

export async function fetchMeetSummaries(): Promise<MeetSummary[]> {
  const { data, error} = await supabase
.from('order_items_geto')
.select('meet_id, user_mail, quantity, price');

  if (error ||!data) {
    console.warn('❌ Veriler alınamadı:', error);
    return [];
}

  // Özet veriyi hesapla
  const summaryMap = new Map<string, { users: Set<string>; revenue: number}>();

  data.forEach(item => {
    const meetId = item.meet_id;
    const user = item.user_mail;
    const revenue = Number(item.quantity) * Number(item.price);

    if (!summaryMap.has(meetId)) {
      summaryMap.set(meetId, { users: new Set(), revenue: 0});
}

    const entry = summaryMap.get(meetId)!;
    entry.users.add(user);
    entry.revenue += revenue;
});

  return Array.from(summaryMap.entries()).map(([meet_id, { users, revenue}]) => ({
    meet_id,
    participant_count: users.size,
    total_revenue: revenue,
}));
}