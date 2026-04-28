import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueAssignment = Database['public']['Tables']['issue_assignments']['Row'];
export type Volunteer = Database['public']['Tables']['volunteers']['Row'];

export interface AssignedTask extends Issue {
  assignment_id: string;
  assignment_status: string;
}

export interface TaskSubmission {
  id: string;
  issue_id: string;
  volunteer_id: string;
  proof_image_url: string;
  description: string;
  latitude?: number;
  longitude?: number;
  status: string;
  submitted_at: string;
}

export const volunteerDashboardService = {
  /**
   * Get the volunteer profile for the currently logged-in user.
   */
  async getVolunteerProfile(userId: string): Promise<Volunteer | null> {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching Volunteer profile:', error);
      return null;
    }
    return data;
  },

  /**
   * Auto-create a volunteer profile
   */
  async createVolunteerProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('volunteers')
      .insert([{ user_id: userId, availability_status: 'available' }]);
      
    if (error) {
      console.error('Error creating Volunteer profile:', error);
      throw error;
    }
  },

  /**
   * Get issues specifically assigned to this volunteer
   */
  async getMyAssignedTasks(volunteerId: string): Promise<AssignedTask[]> {
    const { data, error } = await supabase
      .from('issue_assignments')
      .select(`
        id,
        status,
        issues (*)
      `)
      .eq('assigned_volunteer_id', volunteerId);

    if (error) {
      console.error('Error fetching assigned tasks:', error);
      return [];
    }

    return (data || []).filter(row => row.issues !== null).map((row: any) => ({
      ...row.issues,
      assignment_id: row.id,
      assignment_status: row.status || 'assigned' // fallback if column is newly added
    }));
  },

  /**
   * Start working on a task
   */
  async startTask(issueId: string, assignmentId: string): Promise<void> {
    const { error: updateAssign } = await supabase
      .from('issue_assignments')
      .update({ status: 'in_progress' } as any) // cast as any to bypass strict type check if necessary
      .eq('id', assignmentId);

    if (updateAssign) throw updateAssign;

    const { error: updateIssue } = await supabase
      .from('issues')
      .update({ status: 'in_progress' })
      .eq('id', issueId);

    if (updateIssue) throw updateIssue;
  },

  /**
   * Submit proof of task completion
   */
  async submitTaskProof(
    issueId: string,
    volunteerUserId: string,
    proofImageUrl: string,
    description: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    // Guard: prevent duplicate pending submissions for the same issue
    const { data: existing } = await supabase
      .from('task_submissions')
      .select('id')
      .eq('issue_id', issueId)
      .eq('volunteer_id', volunteerUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new Error('You already have a proof submission pending review for this task.');
    }

    // 1. Insert into task_submissions
    const { error: submitError } = await supabase
      .from('task_submissions')
      .insert([{
        issue_id: issueId,
        volunteer_id: volunteerUserId,
        proof_image_url: proofImageUrl,
        description,
        latitude,
        longitude,
        status: 'pending'
      }]);

    if (submitError) throw submitError;

    // 2. Update issue status to pending_verification
    const { error: issueError } = await supabase
      .from('issues')
      .update({ status: 'pending_verification' })
      .eq('id', issueId);

    if (issueError) throw issueError;
  },

  /**
   * @deprecated Use submitTaskProof() + NGO verification flow instead.
   * This method bypasses the verification system and should NOT be called directly.
   */
  async completeTask(issueId: string, _assignmentId: string, _volunteerUserId: string): Promise<void> {
    throw new Error('Direct task completion is disabled. Please use "Submit Proof" for NGO verification.');
  }
};
