import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToIssueUpdates } from '../services/realtimeService';
import { Activity, Clock } from 'lucide-react';

export default function LiveFeed() {
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from('issue_updates')
        .select(`*, issues(title)`)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (data) setUpdates(data);
    }
    loadRecent();

    const unsubscribe = subscribeToIssueUpdates(null, (payload) => {
      if (payload.eventType === 'INSERT') {
         setUpdates(prev => {
            const newArray = [payload.new, ...prev];
            return newArray.slice(0, 10); // Keep last 10
         });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-surface-main border border-border-main rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-border-main pb-3">
        <Activity className="h-5 w-5 text-brand-900" />
        <h2 className="text-xl font-bold text-text-main">Live Community Feed</h2>
      </div>

      <div className="space-y-4">
        {updates.length === 0 ? (
          <p className="text-text-muted text-sm italic">Waiting for new activity...</p>
        ) : (
          updates.map(update => (
            <div key={update.id} className="flex gap-3 items-start border-l-2 border-brand-900/30 pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-main capitalize">
                  {update.message}
                </p>
                {update.issues?.title && (
                  <p className="text-xs text-text-muted mt-0.5 max-w-[200px] truncate">
                    On: {update.issues.title}
                  </p>
                )}
                <p className="text-[10px] uppercase font-bold text-text-muted mt-1 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
