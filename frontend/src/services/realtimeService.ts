import { supabase } from '../lib/supabase';
import { Issue } from './issues';

export const subscribeToIssues = (callback: (payload: any) => void) => {
  const channel = supabase.channel('realtime:issues')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'issues' },
      (payload) => {
        // Map postgres shape to local expected format
        if (payload.new) {
           const n: any = payload.new;
           payload.new = {
             ...n,
             latitude: n.latitude ?? n.lat,
             longitude: n.longitude ?? n.lng,
           };
        }
        callback(payload);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToIssueUpdates = (issueId: string | null, callback: (payload: any) => void) => {
  let filterConfig: any = { event: 'INSERT', schema: 'public', table: 'issue_updates' };
  if (issueId) {
    filterConfig.filter = `issue_id=eq.${issueId}`;
  }

  const channel = supabase.channel(`realtime:issue_updates:${issueId || 'all'}`)
    .on(
      'postgres_changes',
      filterConfig,
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
