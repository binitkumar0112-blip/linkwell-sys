import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueAssignment = Database['public']['Tables']['issue_assignments']['Row'];
export type Volunteer = Database['public']['Tables']['volunteers']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

export interface DashboardStats {
  total: number;
  claimed: number;
  inProgress: number;
  resolved: number;
  pendingVerifications: number;
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
  issues?: Issue;
  users?: { name: string };
}

export const ngoDashboardService = {
  /**
   * Get the NGO profile ID for the currently logged-in user.
   */
  async getNgoProfileId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('ngos')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching NGO profile:', error);
      return null;
    }
    return data?.id || null;
  },

  /**
   * Get all unclaimed issues (not in issue_assignments)
   */
  async getIncomingIssues(): Promise<Issue[]> {
    // Supabase doesn't easily do "NOT EXISTS" across tables via simple filters.
    // Instead, we can fetch all issues, and filter out those that have assignments.
    // We can use a left join trick, or just fetch all open/reported and filter.
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_assignments (id)
      `)
      .in('status', ['reported', 'open']);

    if (error) {
      console.error('Error fetching incoming issues:', error);
      return [];
    }

    // Filter out issues that have assignments
    const unclaimed = (data || []).filter((issue: any) => 
      !issue.issue_assignments || issue.issue_assignments.length === 0
    );

    // Sort: priority_score + upvotes_count descending
    return unclaimed.sort((a, b) => {
      const scoreA = (a.priority_score || 0) + (a.upvotes_count || 0);
      const scoreB = (b.priority_score || 0) + (b.upvotes_count || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  /**
   * Get issues claimed by this NGO
   */
  async getClaimedIssues(ngoId: string): Promise<(Issue & { assignment_id: string, assigned_volunteer_id: string | null })[]> {
    const { data, error } = await supabase
      .from('issue_assignments')
      .select(`
        id,
        assigned_volunteer_id,
        issues (*)
      `)
      .eq('assigned_ngo_id', ngoId);

    if (error) {
      console.error('Error fetching claimed issues:', error);
      return [];
    }

    return (data || []).filter(row => row.issues !== null).map((row: any) => ({
      ...row.issues,
      assignment_id: row.id,
      assigned_volunteer_id: row.assigned_volunteer_id
    }));
  },

  /**
   * Get stats for the NGO
   */
  async getStats(ngoId: string): Promise<DashboardStats> {
    const { data: assignments, error } = await supabase
      .from('issue_assignments')
      .select(`
        id,
        issues (status)
      `)
      .eq('assigned_ngo_id', ngoId);

    if (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, claimed: 0, inProgress: 0, resolved: 0, pendingVerifications: 0 };
    }

    const validAssignments = (assignments || []).filter(a => a.issues !== null);
    
    let inProgress = 0;
    let resolved = 0;
    let pendingVerifications = 0;

    validAssignments.forEach((a: any) => {
      if (a.issues.status === 'in_progress' || a.issues.status === 'assigned') inProgress++;
      if (a.issues.status === 'resolved') resolved++;
      if (a.issues.status === 'pending_verification') pendingVerifications++;
    });

    const { count: totalIssues } = await supabase
      .from('issue_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_ngo_id', ngoId);

    return {
      total: totalIssues || 0,
      claimed: validAssignments.length,
      inProgress,
      resolved,
      pendingVerifications
    };
  },

  /**
   * Get available volunteers
   */
  async getAvailableVolunteers(): Promise<(Volunteer & { name: string; email?: string })[]> {
    const { data, error } = await supabase
      .from('volunteers')
      .select(`
        *,
        users (name, email)
      `);

    if (error) {
      console.error('Error fetching volunteers:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      name: row.users?.name || 'Unknown Volunteer',
      email: row.users?.email || ''
    }));
  },

  /**
   * Claim an issue
   */
  async claimIssue(issueId: string, ngoId: string): Promise<void> {
    const { error: assignError } = await supabase
      .from('issue_assignments')
      .insert([{
        issue_id: issueId,
        assigned_ngo_id: ngoId,
        assigned_type: 'ngo'
      }]);

    if (assignError) throw assignError;

    const { error: issueError } = await supabase
      .from('issues')
      .update({ status: 'assigned' })
      .eq('id', issueId);

    if (issueError) throw issueError;
  },

  /**
   * Assign a volunteer to a claimed issue
   */
  async assignVolunteer(assignmentId: string, issueId: string, volunteerId: string): Promise<void> {
    const { error: updateAssign } = await supabase
      .from('issue_assignments')
      .update({ assigned_volunteer_id: volunteerId })
      .eq('id', assignmentId);

    if (updateAssign) throw updateAssign;

    const { error: updateIssue } = await supabase
      .from('issues')
      .update({ status: 'in_progress' })
      .eq('id', issueId);

    if (updateIssue) throw updateIssue;
  },

  /**
   * Get pending verifications for issues claimed by this NGO
   */
  async getPendingVerifications(ngoId: string): Promise<TaskSubmission[]> {
    // 1. Get issues claimed by this NGO
    const { data: assignments } = await supabase
      .from('issue_assignments')
      .select('issue_id')
      .eq('assigned_ngo_id', ngoId);

    if (!assignments || assignments.length === 0) return [];

    const issueIds = assignments.map(a => a.issue_id);

    // 2. Get pending submissions for those issues
    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        issues (*),
        users (name)
      `)
      .in('issue_id', issueIds)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Verify a task submission (Approve or Reject)
   */
  async verifyTask(submissionId: string, issueId: string, volunteerId: string, ngoId: string, action: 'approve' | 'reject', notes?: string): Promise<void> {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // 1. Update submission status
    const { error: subError } = await supabase
      .from('task_submissions')
      .update({
        status: newStatus,
        verified_by: ngoId,
        verification_notes: notes || null
      })
      .eq('id', submissionId);

    if (subError) throw subError;

    if (action === 'approve') {
      // 2. Mark issue as resolved
      await supabase.from('issues').update({ status: 'resolved' }).eq('id', issueId);
      
      // 3. Mark assignment as completed
      const { data: volunteerProfile } = await supabase
        .from('volunteers')
        .select('id, tasks_completed, trust_score')
        .eq('user_id', volunteerId)
        .single();

      let assignmentUpdate = supabase.from('issue_assignments')
        .update({ status: 'completed' } as any)
        .eq('issue_id', issueId);

      if (volunteerProfile?.id) {
        assignmentUpdate = assignmentUpdate.eq('assigned_volunteer_id', volunteerProfile.id);
      }

      await assignmentUpdate;

      // 4. Update volunteer trust score
      if (volunteerProfile) {
        const newTasksCompleted = (volunteerProfile.tasks_completed || 0) + 1;
        const newTrustScore = (volunteerProfile.trust_score || 0) + 10;
        
        let newTrustLevel = 'New';
        if (newTrustScore > 100) newTrustLevel = 'Community Leader';
        else if (newTrustScore > 50) newTrustLevel = 'Trusted';
        else if (newTrustScore > 20) newTrustLevel = 'Verified';

        await supabase
          .from('volunteers')
          .update({
            tasks_completed: newTasksCompleted,
            trust_score: newTrustScore,
            trust_level: newTrustLevel
          })
          .eq('user_id', volunteerId);
      }
    } else {
      // Reject: Revert issue back to in_progress
      await supabase.from('issues').update({ status: 'in_progress' }).eq('id', issueId);
    }
  }
};
