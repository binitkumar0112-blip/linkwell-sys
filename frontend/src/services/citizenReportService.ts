/**
 * Citizen Report Service
 * Handles: rate limiting, duplicate detection, and validated issue submission
 * All done client-side + Supabase for hackathon demo (no FastAPI required)
 */
import { supabase } from '../lib/supabase';
import { AIService } from './api';

const VALID_CATEGORIES = ['infrastructure', 'health', 'education', 'food', 'rescue', 'other'];
const RATE_LIMIT_KEY = 'report_timestamps';
const MAX_REPORTS_PER_MINUTE = 5;
const DUPLICATE_WINDOW_MINUTES = 10;

// ── Rate Limiting (localStorage-based, client side) ─────────────────────────
function getRateLimitTimestamps(): number[] {
  try {
    return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  } catch {
    return [];
  }
}

function checkRateLimit(): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const timestamps = getRateLimitTimestamps().filter(t => t > oneMinuteAgo);
  
  if (timestamps.length >= MAX_REPORTS_PER_MINUTE) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + 60_000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Save updated timestamps
  timestamps.push(now);
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
  return { allowed: true, retryAfter: 0 };
}

// ── Duplicate Detection ──────────────────────────────────────────────────────
async function checkDuplicate(title: string, description: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60_000).toISOString();
  
  const { data } = await supabase
    .from('issues')
    .select('id, title, description')
    .gte('created_at', windowStart);

  if (!data?.length) return false;

  const titleLower = title.toLowerCase().trim();
  const descWords = new Set(description.toLowerCase().split(/\s+/).filter(w => w.length > 4));

  for (const issue of data) {
    // Title similarity check
    if (issue.title.toLowerCase().trim() === titleLower) return true;
    
    // Description overlap check (more than 50% of significant words overlap)
    const existingWords = issue.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
    const overlap = existingWords.filter((w: string) => descWords.has(w)).length;
    if (overlap > 0 && overlap / Math.max(existingWords.length, descWords.size) > 0.5) {
      return true;
    }
  }
  
  return false;
}

// ── Validation ───────────────────────────────────────────────────────────────
function validateInput(data: {
  title: string;
  description: string;
  category: string;
}): string | null {
  if (!data.title || data.title.trim().length < 5) {
    return 'Title must be at least 5 characters long.';
  }
  if (!data.description || data.description.trim().length < 10) {
    return 'Description must be at least 10 characters long.';
  }
  if (!VALID_CATEGORIES.includes(data.category.toLowerCase())) {
    return 'Please select a valid category.';
  }
  return null;
}

// ── Main Submit Function ─────────────────────────────────────────────────────
export interface ReportIssueParams {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  reported_by?: string | null;
  contact_email?: string | null;
  photo_url?: string | null;
}

export async function submitIssueReport(params: ReportIssueParams): Promise<{ id: string; urgency?: string; urgency_reason?: string }> {
  // 1. Validate
  const validationError = validateInput(params);
  if (validationError) throw new Error(validationError);

  // 2. Rate limit
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    throw new Error(`⏱️ Too many reports. Please wait ${rateCheck.retryAfter} seconds before submitting again.`);
  }

  // 3. Duplicate detection
  const isDuplicate = await checkDuplicate(params.title, params.description);
  if (isDuplicate) {
    throw new Error('DUPLICATE'); // Special code caught by UI to show warning
  }

  // 4. Ask AI for urgency assessment
  let assessed = { urgency: 'medium', reason: 'Not assessed' } as { urgency: string; reason: string };
  try {
    const aiRes = await AIService.assessUrgency(params.title, params.description, params.category || '');
    if (aiRes && typeof aiRes === 'object' && ['low', 'medium', 'high'].includes((aiRes.urgency || '').toLowerCase())) {
      assessed.urgency = aiRes.urgency.toLowerCase();
      assessed.reason = aiRes.reason || '';
    }
  } catch (e) {
    // keep fallback
  }

  // 4. Insert into Supabase
  const { data, error } = await supabase
    .from('issues')
    .insert([{
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category.toLowerCase(),
      latitude: params.latitude,
      longitude: params.longitude,
      urgency: assessed.urgency,
      urgency_reason: assessed.reason,
      status: 'reported',
      reported_by: params.reported_by || null,
      photo_url: params.photo_url || null,
    }])
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, urgency: assessed.urgency, urgency_reason: assessed.reason };
}

// ── My Reports (logged-in users only) ───────────────────────────────────────
export async function getMyReports(userId: string) {
  const { data, error } = await supabase
    .from('issues')
    .select('id, title, status, urgency, created_at, category')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
