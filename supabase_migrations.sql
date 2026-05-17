-- ============================================================
-- Linkwell Migration: Fixes from Database Alignment Audit
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- FIX 6.1: Create missing RPC function for resource transactions
-- This is called by the backend /resources/add and /resources/use endpoints
CREATE OR REPLACE FUNCTION process_resource_transaction(
  p_resource_id uuid,
  p_ngo_id uuid,
  p_type text,
  p_quantity double precision,
  p_issue_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Validate type
  IF p_type NOT IN ('added', 'used') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  -- Check sufficient stock for 'used' type
  IF p_type = 'used' THEN
    DECLARE
      current_remaining double precision;
    BEGIN
      SELECT (total_added - total_used) INTO current_remaining
        FROM resources WHERE id = p_resource_id AND ngo_id = p_ngo_id;
      IF current_remaining IS NULL THEN
        RAISE EXCEPTION 'Resource not found';
      END IF;
      IF current_remaining < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_remaining, p_quantity;
      END IF;
    END;
  END IF;

  -- Insert transaction record
  INSERT INTO resource_transactions (resource_id, ngo_id, type, quantity, issue_id, notes)
  VALUES (p_resource_id, p_ngo_id, p_type, p_quantity, p_issue_id, p_notes);

  -- Update resource totals
  IF p_type = 'added' THEN
    UPDATE resources SET total_added = total_added + p_quantity WHERE id = p_resource_id;
  ELSE
    UPDATE resources SET total_used = total_used + p_quantity WHERE id = p_resource_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FIX 6.2: Add UNIQUE constraint to prevent duplicate upvotes
-- Without this, users can upvote the same issue unlimited times
ALTER TABLE public.issue_upvotes
  DROP CONSTRAINT IF EXISTS issue_upvotes_unique_vote;
ALTER TABLE public.issue_upvotes
  ADD CONSTRAINT issue_upvotes_unique_vote UNIQUE (issue_id, user_id);
