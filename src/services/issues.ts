import { supabase } from '../lib/supabase';
import { suggestCategory } from './smartService';
import { Database } from '../types/database.types';

export type IssueRow = Database['public']['Tables']['issues']['Row'];
export type IssueInsert = Database['public']['Tables']['issues']['Insert'];

export interface Issue extends IssueRow {
  priority_score?: number;
}

export const createIssue = async (issue: Partial<IssueInsert>) => {
  if (!issue.category || issue.category.toLowerCase() === 'other') {
    issue.category = suggestCategory(issue.description || '');
  }


  let basePriority = 10;
  if (issue.urgency === 'high') basePriority = 50;
  if (issue.urgency === 'medium') basePriority = 30;

  const issueData = {
    ...issue,
    priority_score: basePriority,
    upvotes_count: 0,
    amount_raised: 0,
    // @ts-ignore
    amount_needed: (issue as any).amount_needed || 0
  };

  const { data, error } = await supabase
    .from('issues')
    .insert([issueData as IssueInsert])
    .select();

  if (error) {
    console.error('Error inserting issue:', error);
    throw error;
  }

  return data;
};

export const getIssues = async (): Promise<Issue[]> => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('priority_score', { ascending: false })
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    throw error;
  }

  return data || [];
};

export const upvoteIssue = async (issueId: string, userId: string) => {
  if (!userId) throw new Error("Must be logged in to upvote");

  // UNIQUE constraint will reject duplicates
  const { error: voteError } = await supabase
    .from('issue_upvotes')
    .insert([{ issue_id: issueId, user_id: userId }]);

  if (voteError) {
    if (voteError.code === '23505') {
      throw new Error("You have already upvoted this issue.");
    }
    throw voteError;
  }

  // bump the counts
  const { data: issue } = await supabase
    .from('issues')
    .select('upvotes_count, priority_score')
    .eq('id', issueId)
    .single();

  if (issue) {
    // +2 priority per upvote
    const newCount = (issue.upvotes_count || 0) + 1;
    const newPriority = (issue.priority_score || 0) + 2;

    await supabase
      .from('issues')
      .update({ upvotes_count: newCount, priority_score: newPriority })
      .eq('id', issueId);
  }
};

export const testConnection = async () => {
  try {
    const response = await createIssue({
      title: "Test Issue",
      description: "Testing Supabase connection",
      category: "infrastructure",
      latitude: 19.07,
      longitude: 72.87,
      urgency: 'medium',
      status: 'reported'
    });
    console.log("Supabase connection successful. Response:", response);
  } catch (error) {
    console.error("Test function failed:", error);
  }
};
