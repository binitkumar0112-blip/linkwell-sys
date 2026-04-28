import { supabase } from '../lib/supabase';
import { Issue } from './issues';

export const getAvailableIssues = async (): Promise<Issue[]> => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .in('status', ['reported', 'verified']);

  if (error) {
    console.error('Error fetching available issues:', error);
    return [];
  }

  return data || [];
};

export const getVolunteerAssignments = async (volunteerId: string): Promise<Issue[]> => {
  const { data: assignments, error: assignError } = await supabase
    .from('issue_assignments')
    .select('issue_id')
    .eq('assigned_volunteer_id', volunteerId)
    .eq('assigned_type', 'volunteer');

  if (assignError) {
    console.error('Error fetching volunteer assignments:', assignError);
    return [];
  }

  if (!assignments || assignments.length === 0) return [];

  const issueIds = assignments.map(a => a.issue_id);

  const { data: issues, error: issuesError } = await supabase
    .from('issues')
    .select('*')
    .in('id', issueIds);

  if (issuesError) {
    console.error('Error fetching assigned issues:', issuesError);
    return [];
  }

  return issues || [];
};

export const acceptIssue = async (issueId: string, volunteerId: string, volunteerName: string = 'Volunteer'): Promise<void> => {
  // 1. Insert into issue_assignments
  const { error: assignError } = await supabase
    .from('issue_assignments')
    .insert([{ 
      issue_id: issueId, 
      assigned_volunteer_id: volunteerId, 
      assigned_type: 'volunteer' 
    }]);

  if (assignError) {
    console.error('Error assigning volunteer:', assignError);
    throw assignError;
  }

  // 2. Update issue status to in_progress
  await supabase.from('issues').update({ status: 'in_progress' }).eq('id', issueId);

  // 3. Add entry in issue_updates
  await supabase.from('issue_updates').insert([{ 
    issue_id: issueId, 
    message: `Volunteer assigned: ${volunteerName}` 
  }]);
};
