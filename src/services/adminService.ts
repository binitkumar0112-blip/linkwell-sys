import { supabase } from '../lib/supabase';

export interface NgoApplication {
  id: string;
  user_id: string;
  verification_id: string;
  org_name: string;
  registration_number: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const adminService = {
  /** Fetch all applications, optionally filtered by status */
  async getApplications(status?: string): Promise<NgoApplication[]> {
    let query = supabase
      .from('ngo_applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
    return data || [];
  },

  /** Fetch a single application by verification_id */
  async getApplicationByVerificationId(verificationId: string): Promise<NgoApplication | null> {
    const { data, error } = await supabase
      .from('ngo_applications')
      .select('*')
      .eq('verification_id', verificationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
    return data;
  },

  /** Fetch application for the current user */
  async getMyApplication(userId: string): Promise<NgoApplication | null> {
    const { data, error } = await supabase
      .from('ngo_applications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching my application:', error);
      return null;
    }
    return data;
  },

  /** Approve an application */
  async approveApplication(applicationId: string, reviewerEmail: string): Promise<void> {
    const { error } = await supabase
      .from('ngo_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerEmail,
      })
      .eq('id', applicationId);

    if (error) throw error;
  },

  /** Reject an application */
  async rejectApplication(applicationId: string, reason: string, reviewerEmail: string): Promise<void> {
    const { error } = await supabase
      .from('ngo_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerEmail,
      })
      .eq('id', applicationId);

    if (error) throw error;
  },

  /** Revoke (set back to pending) */
  async revokeApplication(applicationId: string, reviewerEmail: string): Promise<void> {
    const { error } = await supabase
      .from('ngo_applications')
      .update({
        status: 'pending',
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerEmail,
      })
      .eq('id', applicationId);

    if (error) throw error;
  },

  /** Public status check — only returns verification_id + status */
  async checkStatus(verificationId: string): Promise<{ verification_id: string; status: string; rejection_reason?: string } | null> {
    const { data, error } = await supabase
      .from('ngo_applications')
      .select('verification_id, status, rejection_reason')
      .eq('verification_id', verificationId)
      .maybeSingle();

    if (error) {
      console.error('Error checking status:', error);
      return null;
    }
    return data;
  },
};
