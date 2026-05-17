-- ============================================================
-- Linkwell RLS Policies — Run in Supabase Dashboard > SQL Editor
-- This fixes the infinite loading bug after login/signup.
-- ============================================================

-- ===== USERS TABLE =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own row (during signup sync)
CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Allow all authenticated users to read all users (needed for volunteer lists, NGO lookups, etc.)
CREATE POLICY "Authenticated users can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- ===== USER_PROFILES TABLE =====
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ===== NGOS TABLE =====
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

-- Everyone can read NGOs (public listing)
CREATE POLICY "Anyone can read ngos" ON public.ngos
  FOR SELECT TO authenticated
  USING (true);

-- Anon can also read NGOs (public page)
CREATE POLICY "Anon can read ngos" ON public.ngos
  FOR SELECT TO anon
  USING (true);

-- NGO admins can insert their own NGO
CREATE POLICY "NGO admin can insert ngo" ON public.ngos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- NGO admins can update their own NGO
CREATE POLICY "NGO admin can update own ngo" ON public.ngos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ===== VOLUNTEERS TABLE =====
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read volunteers" ON public.volunteers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own volunteer record" ON public.volunteers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own volunteer record" ON public.volunteers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ===== ISSUES TABLE =====
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Everyone can read issues (including anon for public views)
CREATE POLICY "Anyone can read issues" ON public.issues
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read issues" ON public.issues
  FOR SELECT TO anon
  USING (true);

-- Authenticated users can create issues
CREATE POLICY "Authenticated can create issues" ON public.issues
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update issues (status changes, assignments)
CREATE POLICY "Authenticated can update issues" ON public.issues
  FOR UPDATE TO authenticated
  USING (true);

-- ===== ISSUE_UPVOTES TABLE =====
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read upvotes" ON public.issue_upvotes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own upvote" ON public.issue_upvotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===== ISSUE_UPDATES TABLE =====
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read issue updates" ON public.issue_updates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create issue updates" ON public.issue_updates
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ===== ISSUE_ASSIGNMENTS TABLE =====
ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read assignments" ON public.issue_assignments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create assignments" ON public.issue_assignments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update assignments" ON public.issue_assignments
  FOR UPDATE TO authenticated
  USING (true);

-- ===== DONATIONS TABLE =====
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read donations" ON public.donations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own donation" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===== CROSS_NGO_ALERTS TABLE =====
ALTER TABLE public.cross_ngo_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read alerts" ON public.cross_ngo_alerts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create alerts" ON public.cross_ngo_alerts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update alerts" ON public.cross_ngo_alerts
  FOR UPDATE TO authenticated
  USING (true);

-- ===== NGO_RESOURCES TABLE =====
ALTER TABLE public.ngo_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ngo_resources" ON public.ngo_resources
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert ngo_resources" ON public.ngo_resources
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update ngo_resources" ON public.ngo_resources
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete ngo_resources" ON public.ngo_resources
  FOR DELETE TO authenticated
  USING (true);

-- ===== RESOURCES TABLE =====
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read resources" ON public.resources
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert resources" ON public.resources
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update resources" ON public.resources
  FOR UPDATE TO authenticated
  USING (true);

-- ===== RESOURCE_TRANSACTIONS TABLE =====
ALTER TABLE public.resource_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read resource_transactions" ON public.resource_transactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert resource_transactions" ON public.resource_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ===== TASK_SUBMISSIONS TABLE =====
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read task_submissions" ON public.task_submissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert task_submissions" ON public.task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update task_submissions" ON public.task_submissions
  FOR UPDATE TO authenticated
  USING (true);
