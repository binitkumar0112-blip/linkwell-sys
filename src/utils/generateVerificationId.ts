// format: NGO-2026-XXXXX, checks DB for collisions

import { supabase } from '../lib/supabase';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomCode(): string {
  return Array.from({ length: 5 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

export async function generateVerificationId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const id = `NGO-2026-${randomCode()}`;

    const { data } = await supabase
      .from('ngo_applications')
      .select('id')
      .eq('verification_id', id)
      .maybeSingle();

    if (!data) return id; // no collision
    attempts++;
  }
  throw new Error('Failed to generate unique verification ID after 10 attempts');
}
