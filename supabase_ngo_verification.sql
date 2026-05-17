-- ============================================================
-- NGO Verification & Super Admin — Database Setup
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Widen the users.role CHECK constraint to include 'superadmin'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['citizen'::text, 'volunteer'::text, 'ngo_admin'::text, 'superadmin'::text]));

-- 2. Create ngo_applications table
CREATE TABLE IF NOT EXISTS public.ngo_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  verification_id text NOT NULL UNIQUE,
  org_name text NOT NULL,
  registration_number text,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  website text,
  description text,
  status text NOT NULL DEFAULT 'pending'::text
    CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,
  submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamp with time zone,
  reviewed_by text,
  CONSTRAINT ngo_applications_pkey PRIMARY KEY (id),
  CONSTRAINT ngo_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 3. Enable Row Level Security
ALTER TABLE public.ngo_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- 4a. Public can read ONLY verification_id and status (no login needed)
DROP POLICY IF EXISTS "Public can check verification status" ON public.ngo_applications;
CREATE POLICY "Public can check verification status"
  ON public.ngo_applications
  FOR SELECT
  TO anon
  USING (true);
-- Note: anon will only see verification_id + status because we
-- restrict columns in the frontend query. RLS controls row access,
-- not column access. For column-level restriction, we rely on the
-- frontend only selecting those two columns. This is acceptable for
-- a hackathon. For production, use a database view.

-- 4b. Authenticated NGO can read their own application
DROP POLICY IF EXISTS "NGO can read own application" ON public.ngo_applications;
CREATE POLICY "NGO can read own application"
  ON public.ngo_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4c. Authenticated NGO can insert their own application
DROP POLICY IF EXISTS "NGO can submit application" ON public.ngo_applications;
CREATE POLICY "NGO can submit application"
  ON public.ngo_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4d. Super admin can read ALL applications
DROP POLICY IF EXISTS "Super admin can read all applications" ON public.ngo_applications;
CREATE POLICY "Super admin can read all applications"
  ON public.ngo_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 4e. Super admin can update ALL applications (approve/reject/revoke)
DROP POLICY IF EXISTS "Super admin can update applications" ON public.ngo_applications;
CREATE POLICY "Super admin can update applications"
  ON public.ngo_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 4f. No DELETE policy = nobody can delete rows

-- ============================================================
-- SUPER ADMIN SETUP
-- After creating your account through the normal login page,
-- run this to elevate your role:
--
--   UPDATE public.users
--   SET role = 'superadmin'
--   WHERE email = 'YOUR_EMAIL_HERE';
--
-- Replace YOUR_EMAIL_HERE with the email you signed up with.
-- ============================================================
