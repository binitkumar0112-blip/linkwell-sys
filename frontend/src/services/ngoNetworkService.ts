import { supabase } from '../lib/supabase';

export interface NgoResource {
  id: string;
  ngo_id: string;
  title: string;
  category: string;
  description: string;
  quantity: number;
  status: string;
  created_at: string;
  ngo?: {
    name: string;
  };
}

export interface EscalatedAlert {
  id: string;
  issue_id: string;
  from_ngo_id: string;
  urgency: string;
  status: string;
  message: string | null;
  created_at: string;
  issues: {
    title: string;
    description: string | null;
    category: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  ngos: {
    name: string;
  } | null;
}

export const ngoNetworkService = {
  async getNetworkResources(): Promise<NgoResource[]> {
    const { data, error } = await supabase
      .from('ngo_resources')
      .select(`
        *,
        ngo:ngos(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching network resources:", error);
      return [];
    }
    
    // Fallback name if left join is weird
    return (data || []).map(r => ({
      ...r,
      ngo: r.ngo || { name: 'Unknown NGO' }
    }));
  },

  async postResource(ngoId: string, resource: Partial<NgoResource>): Promise<void> {
    const { error } = await supabase
      .from('ngo_resources')
      .insert({
        ngo_id: ngoId,
        title: resource.title,
        category: resource.category,
        description: resource.description,
        quantity: resource.quantity || 1,
        status: 'available'
      });

    if (error) {
      console.error("Error posting resource:", error);
      throw error;
    }
  },

  async claimResource(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('ngo_resources')
      .update({ status: 'claimed' })
      .eq('id', resourceId);

    if (error) {
      console.error("Error claiming resource:", error);
      throw error;
    }
  },

  async getEscalatedAlerts(): Promise<EscalatedAlert[]> {
    const { data, error } = await supabase
      .from('cross_ngo_alerts')
      .select(`
        id,
        issue_id,
        from_ngo_id,
        urgency,
        status,
        message,
        created_at,
        issues:issue_id (title, description, category, latitude, longitude),
        ngos:from_ngo_id (name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching escalated alerts:', error);
      throw error;
    }

    // Supabase returns foreign keys as arrays — extract first item
    const normalized = (data || []).map((row: any) => ({
      id: row.id,
      issue_id: row.issue_id,
      from_ngo_id: row.from_ngo_id,
      urgency: row.urgency,
      status: row.status,
      message: row.message,
      created_at: row.created_at,
      issues: Array.isArray(row.issues) && row.issues.length > 0
        ? row.issues[0]
        : (row.issues || null),
      ngos: Array.isArray(row.ngos) && row.ngos.length > 0
        ? row.ngos[0]
        : (row.ngos || null),
    }));

    return normalized as EscalatedAlert[];
  }
};
