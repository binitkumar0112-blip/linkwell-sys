import { supabase } from '../lib/supabase';
import { Issue } from './issues';

const CATEGORY_WEIGHTS: Record<string, number> = {
  health: 5,
  rescue: 5,
  infrastructure: 4,
  food: 4,
  education: 3,
  environment: 3,
};

const URGENCY_WEIGHTS: Record<string, number> = {
  high: 5,
  medium: 3,
  low: 1,
};

export const calculatePriority = (issue: Issue): number => {
  let score = 0;
  
  const category = (issue.category || '').toLowerCase();
  score += (CATEGORY_WEIGHTS[category] || 1) * 10;
  
  const urgency = (issue.urgency || '').toLowerCase();
  score += (URGENCY_WEIGHTS[urgency] || 2) * 5; 
  
  if (issue.created_at) {
    const ageInDays = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(Math.floor(ageInDays), 20); // Cap age bonus to +20 points max
  }
  
  return score;
};

export const updatePriority = async (issueId: string): Promise<void> => {
  // No longer updating a DB column since it was removed from the schema.
  // Priority is now calculated on the fly in getIssues().
  console.log(`Priority update requested for ${issueId} - handled on-the-fly.`);
};

export const getTopPriorityIssues = async (limit: number = 10): Promise<Issue[]> => {
  const { data, error } = await supabase
    .from('issues')
    .select('*');

  if (error) {
    console.error('Error fetching top issues:', error);
    return [];
  }

  return (data || [])
    .map(issue => ({
      ...issue,
      priority_score: calculatePriority(issue as unknown as Issue)
    }))
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, limit);
};

export const suggestCategory = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('water') || lowerDesc.includes('pipeline') || lowerDesc.includes('road') || lowerDesc.includes('pothole')) {
    return 'infrastructure';
  }
  if (lowerDesc.includes('food') || lowerDesc.includes('hunger') || lowerDesc.includes('starving') || lowerDesc.includes('ration')) {
    return 'food';
  }
  if (lowerDesc.includes('injury') || lowerDesc.includes('hospital') || lowerDesc.includes('medical') || lowerDesc.includes('sick')) {
    return 'health';
  }
  if (lowerDesc.includes('flood') || lowerDesc.includes('trapped') || lowerDesc.includes('rescue')) {
    return 'rescue';
  }
  if (lowerDesc.includes('school') || lowerDesc.includes('education') || lowerDesc.includes('books')) {
    return 'education';
  }
  
  return 'other';
};
