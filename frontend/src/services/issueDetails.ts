import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueUpdate = Database['public']['Tables']['issue_updates']['Row'];
export type IssueAssignment = Database['public']['Tables']['issue_assignments']['Row'];

export interface DetailedIssue extends Issue {
  updates: IssueUpdate[];
  assignments: IssueAssignment[];
  reporter?: { name: string; email: string } | null;
  resource_transactions?: any[];
}

export const getIssueById = async (id: string): Promise<DetailedIssue | null> => {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      updates:issue_updates(*),
      assignments:issue_assignments(*),
      reporter:users(name, email),
      resource_transactions(quantity, type, notes, created_at, ngo_id, resources(name, category, unit))
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching issue by id:', error);
    throw error;
  }

  return data as unknown as DetailedIssue;
};

export const getIssueUpdates = async (issueId: string): Promise<IssueUpdate[]> => {
  const { data, error } = await supabase
    .from('issue_updates')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching issue updates:', error);
    throw error;
  }

  return data || [];
};

export const updateIssueStatus = async (issueId: string, status: string): Promise<void> => {
  // 1. Update the issue status
  const { error: updateError } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId);

  if (updateError) {
    console.error('Error updating issue status:', updateError);
    throw updateError;
  }

  // 2. Insert a new record into issue_updates table
  const message = `Status changed to ${status}`;
  const { error: insertError } = await supabase
    .from('issue_updates')
    .insert([
      { issue_id: issueId, message }
    ]);

  if (insertError) {
    console.error('Error inserting issue update:', insertError);
    throw insertError;
  }
};
