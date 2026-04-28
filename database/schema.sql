-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cross_ngo_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid,
  from_ngo_id uuid,
  urgency text,
  required_resources ARRAY,
  status text DEFAULT 'open'::text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  message text,
  CONSTRAINT cross_ngo_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT cross_ngo_alerts_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT cross_ngo_alerts_from_ngo_id_fkey FOREIGN KEY (from_ngo_id) REFERENCES public.ngos(id)
);
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  user_id text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_status text DEFAULT 'completed'::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.issue_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  assigned_type text NOT NULL DEFAULT 'ngo'::text,
  assigned_ngo_id uuid,
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_volunteer_id uuid,
  status text DEFAULT 'assigned'::text,
  CONSTRAINT issue_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT issue_assignments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT issue_assignments_assigned_ngo_id_fkey FOREIGN KEY (assigned_ngo_id) REFERENCES public.ngos(id),
  CONSTRAINT fk_volunteer FOREIGN KEY (assigned_volunteer_id) REFERENCES public.volunteers(id)
);
CREATE TABLE public.issue_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT issue_updates_pkey PRIMARY KEY (id),
  CONSTRAINT issue_updates_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id)
);
CREATE TABLE public.issue_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  user_id text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT issue_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT issue_upvotes_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT issue_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other'::text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'reported'::text,
  urgency text NOT NULL DEFAULT 'medium'::text,
  reported_by text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  upvotes_count integer DEFAULT 0,
  priority_score double precision DEFAULT 0.0,
  amount_needed numeric DEFAULT 0.00,
  amount_raised numeric DEFAULT 0.00,
  photo_url text,
  urgency_reason text,
  CONSTRAINT issues_pkey PRIMARY KEY (id),
  CONSTRAINT issues_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id)
);
CREATE TABLE public.ngo_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  description text,
  quantity integer DEFAULT 1,
  status text NOT NULL DEFAULT 'available'::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ngo_resources_pkey PRIMARY KEY (id),
  CONSTRAINT ngo_resources_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id)
);
CREATE TABLE public.ngos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general'::text,
  latitude double precision,
  longitude double precision,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id text,
  approval_status text DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ngos_pkey PRIMARY KEY (id),
  CONSTRAINT ngos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.resource_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL,
  ngo_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['added'::text, 'used'::text])),
  quantity double precision NOT NULL,
  issue_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resource_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT resource_transactions_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id),
  CONSTRAINT resource_transactions_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id),
  CONSTRAINT resource_transactions_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id)
);
CREATE TABLE public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  total_added double precision NOT NULL DEFAULT 0,
  total_used double precision NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resources_pkey PRIMARY KEY (id),
  CONSTRAINT resources_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngos(id)
);
CREATE TABLE public.task_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  volunteer_id text NOT NULL,
  proof_image_url text NOT NULL,
  description text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  verified_by uuid,
  verification_notes text,
  submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT task_submissions_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT task_submissions_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.users(id),
  CONSTRAINT task_submissions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.ngos(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  skills ARRAY,
  interests ARRAY,
  latitude double precision,
  longitude double precision,
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  pending_ngo_name text,
  pending_ngo_category text,
  pending_ngo_latitude double precision,
  pending_ngo_longitude double precision,
  ngo_application_status text DEFAULT 'none'::text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'citizen'::text CHECK (role = ANY (ARRAY['citizen'::text, 'volunteer'::text, 'ngo_admin'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  assigned_ngo_id uuid,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_assigned_ngo_id_fkey FOREIGN KEY (assigned_ngo_id) REFERENCES public.ngos(id)
);
CREATE TABLE public.volunteers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text UNIQUE,
  availability_status text DEFAULT 'available'::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  skills ARRAY,
  interests ARRAY,
  latitude double precision,
  longitude double precision,
  tasks_completed integer DEFAULT 0,
  trust_score integer DEFAULT 0,
  trust_level text DEFAULT 'New'::text,
  CONSTRAINT volunteers_pkey PRIMARY KEY (id),
  CONSTRAINT volunteers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);