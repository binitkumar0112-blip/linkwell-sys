import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { Issue } from './issues';

export type NGO = Database['public']['Tables']['ngos']['Row'];

export type NGOWithDetails = NGO & { users?: { email?: string } | null };

// Simple distance formula (Pythagorean theorem approximation for local distances)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy) * 111; // multiply by 111 for approx kilometers
}

export const getAllNGOs = async (): Promise<NGOWithDetails[]> => {
  // First, fetch the NGOs
  const { data: ngos, error: ngoError } = await supabase.from('ngos').select('*');
  if (ngoError) {
    console.error('Error fetching NGOs:', ngoError);
    return [];
  }
  
  if (!ngos || ngos.length === 0) return [];

  // Get user_ids to fetch emails
  const userIds = ngos.map(n => n.user_id).filter(Boolean) as string[];
  
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);
      
    if (!userError && users) {
      userMap = users.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return ngos.map(ngo => ({
    ...ngo,
    users: ngo.user_id && userMap[ngo.user_id] ? { email: userMap[ngo.user_id] } : null
  }));
};

export const getNGOsByCategory = async (category: string): Promise<NGOWithDetails[]> => {
  const ngos = await getAllNGOs();
  return ngos.filter(n => n.category.toLowerCase() === category.toLowerCase());
};

export const getNearbyNGOs = async (lat: number, lng: number): Promise<(NGOWithDetails & { distance: number })[]> => {
  const ngos = await getAllNGOs();
  return ngos
    .filter(n => n.latitude !== null && n.longitude !== null)
    .map(n => ({
      ...n,
      distance: calculateDistance(lat, lng, n.latitude!, n.longitude!)
    }))
    .sort((a, b) => a.distance - b.distance);
};

export const getMatchingNGOs = async (issue: Issue): Promise<(NGOWithDetails & { distance: number })[]> => {
  if (issue.latitude === null || issue.longitude === null) return [];
  const nearby = await getNearbyNGOs(issue.latitude, issue.longitude);
  
  // Rule: Match category exactly, or fallback, prioritize verified NGOs.
  return nearby
    .filter(ngo => ngo.category.toLowerCase() === issue.category.toLowerCase() || issue.category === 'other')
    .sort((a, b) => {
       if (a.verified && !b.verified) return -1;
       if (!a.verified && b.verified) return 1;
       return a.distance - b.distance;
    });
};

export const assignNGO = async (issueId: string, ngoId: string, ngoName: string): Promise<void> => {
  // 1. Insert into issue_assignments
  const { error: assignError } = await supabase
    .from('issue_assignments')
    .insert([{ 
      issue_id: issueId, 
      assigned_ngo_id: ngoId, 
      assigned_type: 'ngo' 
    }]);

  if (assignError) {
    console.error('Error assigning NGO:', assignError);
    throw assignError;
  }

  // 2. Update status and timeline.
  await supabase.from('issues').update({ status: 'assigned' }).eq('id', issueId);
  await supabase.from('issue_updates').insert([{ issue_id: issueId, message: `Assigned to NGO: ${ngoName}` }]);
};
