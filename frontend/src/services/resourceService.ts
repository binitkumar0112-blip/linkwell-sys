import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

// Assuming the FastAPI backend runs on this port, but we'll use Vite proxy in a real environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
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

// 1. Get all resources
export async function fetchResources(): Promise<Resource[]> {
  const response = await fetch(`${API_URL}/resources/`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
}

// 2. Create new resource type
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

// 3. Add stock
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

// 4. Use stock
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

// 5. Get Analytics
export async function fetchResourceAnalytics(): Promise<ResourceAnalytics> {
  const response = await fetch(`${API_URL}/resources/analytics`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

// Utility: Fetch all active issues for the NGO (for the "use stock" dropdown)
export async function fetchActiveNgoIssues() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // We need to fetch the assigned_ngo_id first
  const { data: userData } = await supabase
    .from('users')
    .select('assigned_ngo_id')
    .eq('id', user.uid)
    .single();

  if (!userData?.assigned_ngo_id) return [];

  // Get issues assigned to this NGO that are not resolved
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
