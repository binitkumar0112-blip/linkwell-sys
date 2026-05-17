import { supabase } from '../lib/supabase';


const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  unit: string;
  total_added: number;
  total_used: number;
  created_at: string;
}

export interface ResourceAnalytics {
  summary: {
    total_resource_types: number;
    total_units_added: number;
    total_units_used: number;
    total_units_remaining: number;
  };
  usage_by_category: { name: string; value: number }[];
  low_stock_warnings: { id: string; name: string; remaining: number; unit: string }[];
}


export async function fetchResources(): Promise<Resource[]> {
  const response = await fetch(`${API_URL}/resources/`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
}


export async function createResource(data: { name: string; category: string; unit: string }): Promise<Resource> {
  const response = await fetch(`${API_URL}/resources/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create resource');
  }
  return response.json();
}


export async function addStock(data: { resource_id: string; quantity: number; notes?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/resources/add`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to add stock');
  }
}


export async function useStock(data: { resource_id: string; quantity: number; issue_id: string; notes?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/resources/use`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to use stock');
  }
}


export async function fetchResourceAnalytics(): Promise<ResourceAnalytics> {
  const response = await fetch(`${API_URL}/resources/analytics`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

// get active issues for the "use stock" dropdown
export async function fetchActiveNgoIssues() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');


  const { data: userData } = await supabase
    .from('users')
    .select('assigned_ngo_id')
    .eq('id', user.id)
    .single();

  if (!userData?.assigned_ngo_id) return [];


  const { data: assignments } = await supabase
    .from('issue_assignments')
    .select('issue_id')
    .eq('assigned_ngo_id', userData.assigned_ngo_id);

  if (!assignments || assignments.length === 0) return [];

  const issueIds = assignments.map(a => a.issue_id);

  const { data: issues } = await supabase
    .from('issues')
    .select('id, title, status')
    .in('id', issueIds)
    .in('status', ['reported', 'assigned', 'in_progress', 'pending_verification']);

  return issues || [];
}
