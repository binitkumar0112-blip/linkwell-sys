import { supabase } from '../lib/supabase';

export const processDonation = async (issueId: string, userId: string | null, amount: number) => {
  if (amount <= 0) throw new Error("Donation amount must be greater than zero");

  // 1. Fetch current issue donation status
  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('amount_raised, amount_needed')
    .eq('id', issueId)
    .single();

  if (fetchError || !issue) throw new Error("Could not find issue details");

  // Allow overfunding technically, or cap it? Prompt says: "Prevent over-funding beyond amount_needed"
  if (issue.amount_needed && issue.amount_raised >= issue.amount_needed) {
    throw new Error("This issue is already fully funded. Thank you!");
  }

  const remaining = issue.amount_needed - issue.amount_raised;
  const finalAmount = amount > remaining && issue.amount_needed > 0 ? remaining : amount;

  // 2. Insert Donation record
  const { error: insertError } = await supabase
    .from('donations')
    .insert([{
      issue_id: issueId,
      user_id: userId,
      amount: finalAmount,
      payment_status: 'completed'
    }]);

  if (insertError) throw insertError;

  // 3. Update Issue amount_raised
  const { error: updateError } = await supabase
    .from('issues')
    .update({ amount_raised: issue.amount_raised + finalAmount })
    .eq('id', issueId);

  if (updateError) throw updateError;

  return finalAmount; // return actual amount processed
};
