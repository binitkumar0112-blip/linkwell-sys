import { supabase } from '../lib/supabase';

export interface AppStats {
  totalIssues: number;
  resolvedIssues: number;
  volunteers: number;
  ngos: number;
}

export const getAppStats = async (): Promise<AppStats> => {
  try {
    const [
      { count: totalIssues },
      { count: resolvedIssues },
      { count: volunteers },
      { count: ngos }
    ] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('volunteers').select('*', { count: 'exact', head: true }),
      supabase.from('ngos').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalIssues: totalIssues || 0,
      resolvedIssues: resolvedIssues || 0,
      volunteers: volunteers || 0,
      ngos: ngos || 0
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return {
      totalIssues: 0,
      resolvedIssues: 0,
      volunteers: 0,
      ngos: 0
    };
  }
};
