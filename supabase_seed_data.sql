-- ============================================================
-- LINKWELL SEED DATA
-- Run in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── 1. USERS ──────────────────────────────────────────────────
-- Using fixed UUIDs so foreign keys work. These are NOT auth users,
-- just rows in the public.users table for demo purposes.

INSERT INTO public.users (id, name, email, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav@linkwell.demo', 'citizen'),
  ('a1000000-0000-0000-0000-000000000002', 'Priya Patel', 'priya@linkwell.demo', 'citizen'),
  ('a1000000-0000-0000-0000-000000000003', 'Rohan Mehta', 'rohan@linkwell.demo', 'citizen'),
  ('a1000000-0000-0000-0000-000000000004', 'Sneha Iyer', 'sneha@linkwell.demo', 'volunteer'),
  ('a1000000-0000-0000-0000-000000000005', 'Karan Singh', 'karan@linkwell.demo', 'volunteer'),
  ('a1000000-0000-0000-0000-000000000006', 'Ananya Desai', 'ananya@linkwell.demo', 'volunteer'),
  ('a1000000-0000-0000-0000-000000000007', 'Vikram Joshi', 'vikram@linkwell.demo', 'ngo_admin'),
  ('a1000000-0000-0000-0000-000000000008', 'Meera Kulkarni', 'meera@linkwell.demo', 'ngo_admin'),
  ('a1000000-0000-0000-0000-000000000009', 'Raj Thakur', 'raj@linkwell.demo', 'ngo_admin')
ON CONFLICT (email) DO NOTHING;

-- ── 2. NGOS ───────────────────────────────────────────────────
INSERT INTO public.ngos (id, name, category, latitude, longitude, verified, user_id, approval_status) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'Mumbai CleanUp Foundation', 'sanitation', 19.0760, 72.8777, true, 'a1000000-0000-0000-0000-000000000007', 'approved'),
  ('b2000000-0000-0000-0000-000000000002', 'Green Pune Initiative', 'environment', 18.5204, 73.8567, true, 'a1000000-0000-0000-0000-000000000008', 'approved'),
  ('b2000000-0000-0000-0000-000000000003', 'Delhi Water Aid', 'water', 28.7041, 77.1025, true, 'a1000000-0000-0000-0000-000000000009', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Link NGO admins to their NGOs
UPDATE public.users SET assigned_ngo_id = 'b2000000-0000-0000-0000-000000000001' WHERE id = 'a1000000-0000-0000-0000-000000000007';
UPDATE public.users SET assigned_ngo_id = 'b2000000-0000-0000-0000-000000000002' WHERE id = 'a1000000-0000-0000-0000-000000000008';
UPDATE public.users SET assigned_ngo_id = 'b2000000-0000-0000-0000-000000000003' WHERE id = 'a1000000-0000-0000-0000-000000000009';

-- ── 3. VOLUNTEERS ─────────────────────────────────────────────
INSERT INTO public.volunteers (id, user_id, availability_status, skills, interests, latitude, longitude, tasks_completed, trust_score, trust_level) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'available', ARRAY['first_aid','cleaning'], ARRAY['sanitation','health'], 19.0825, 72.8814, 12, 78, 'Reliable'),
  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'available', ARRAY['driving','logistics'], ARRAY['environment','transport'], 18.5308, 73.8475, 8, 62, 'Active'),
  ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', 'busy', ARRAY['teaching','communication'], ARRAY['education','community'], 28.6139, 77.2090, 25, 92, 'Trusted')
ON CONFLICT (user_id) DO NOTHING;

-- ── 4. USER PROFILES ──────────────────────────────────────────
INSERT INTO public.user_profiles (user_id, skills, interests, latitude, longitude, onboarding_completed) VALUES
  ('a1000000-0000-0000-0000-000000000001', ARRAY['reporting'], ARRAY['civic'], 19.0760, 72.8777, true),
  ('a1000000-0000-0000-0000-000000000002', ARRAY['photography'], ARRAY['environment'], 19.0330, 73.0297, true),
  ('a1000000-0000-0000-0000-000000000003', ARRAY['writing'], ARRAY['infrastructure'], 19.2183, 72.9781, true),
  ('a1000000-0000-0000-0000-000000000004', ARRAY['first_aid','cleaning'], ARRAY['sanitation'], 19.0825, 72.8814, true),
  ('a1000000-0000-0000-0000-000000000005', ARRAY['driving'], ARRAY['environment'], 18.5308, 73.8475, true),
  ('a1000000-0000-0000-0000-000000000006', ARRAY['teaching'], ARRAY['education'], 28.6139, 77.2090, true),
  ('a1000000-0000-0000-0000-000000000007', ARRAY['management'], ARRAY['sanitation'], 19.0760, 72.8777, true),
  ('a1000000-0000-0000-0000-000000000008', ARRAY['planning'], ARRAY['environment'], 18.5204, 73.8567, true),
  ('a1000000-0000-0000-0000-000000000009', ARRAY['engineering'], ARRAY['water'], 28.7041, 77.1025, true)
ON CONFLICT (user_id) DO NOTHING;

-- ── 5. ISSUES (reports) ───────────────────────────────────────
INSERT INTO public.issues (id, title, description, category, latitude, longitude, status, urgency, reported_by, upvotes_count, priority_score, amount_needed, amount_raised, urgency_reason) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'Overflowing garbage near Dadar station', 'Large pile of garbage blocking the pedestrian path near Dadar West station exit. Foul smell and stray animals gathering.', 'sanitation', 19.0178, 72.8478, 'in_progress', 'high', 'a1000000-0000-0000-0000-000000000001', 24, 8.5, 5000, 3200, 'Health hazard in crowded area'),
  ('d4000000-0000-0000-0000-000000000002', 'Pothole on FC Road causing accidents', 'Deep pothole near FC Road junction. Two-wheelers have been falling. Needs immediate patching.', 'infrastructure', 18.5236, 73.8418, 'reported', 'critical', 'a1000000-0000-0000-0000-000000000002', 47, 9.2, 15000, 0, 'Multiple accidents reported'),
  ('d4000000-0000-0000-0000-000000000003', 'Broken water pipeline in Dwarka', 'Water pipeline burst on Sector 12 main road. Clean water wasting for 3 days. Residents affected.', 'water', 28.5921, 77.0460, 'assigned', 'high', 'a1000000-0000-0000-0000-000000000003', 31, 7.8, 25000, 8500, 'Water scarcity in summer'),
  ('d4000000-0000-0000-0000-000000000004', 'Illegal dumping in Aarey forest area', 'Construction debris being dumped near Aarey Colony. Trees damaged and water body polluted.', 'environment', 19.1560, 72.8646, 'reported', 'medium', 'a1000000-0000-0000-0000-000000000001', 18, 6.3, 10000, 1500, 'Environmental damage'),
  ('d4000000-0000-0000-0000-000000000005', 'Street lights not working on MG Road', 'Entire stretch of MG Road from Station to Inox has no street lights. Very unsafe at night.', 'infrastructure', 18.5196, 73.8554, 'resolved', 'medium', 'a1000000-0000-0000-0000-000000000002', 15, 5.1, 8000, 8000, 'Safety concern at night'),
  ('d4000000-0000-0000-0000-000000000006', 'Stagnant water breeding mosquitoes', 'Large pool of stagnant water near Andheri sports complex. Dengue cases rising in the area.', 'sanitation', 19.1197, 72.8464, 'in_progress', 'critical', 'a1000000-0000-0000-0000-000000000003', 52, 9.5, 3000, 2800, 'Dengue outbreak risk'),
  ('d4000000-0000-0000-0000-000000000007', 'Fallen tree blocking road after storm', 'Large banyan tree fell during last night storm on SV Road. Traffic completely blocked.', 'infrastructure', 19.0640, 72.8402, 'assigned', 'critical', 'a1000000-0000-0000-0000-000000000001', 38, 9.0, 2000, 2000, 'Road completely blocked'),
  ('d4000000-0000-0000-0000-000000000008', 'Open manhole near school entrance', 'Manhole cover missing outside Ryan International School gate. Extremely dangerous for children.', 'infrastructure', 19.2094, 72.8342, 'in_progress', 'critical', 'a1000000-0000-0000-0000-000000000002', 65, 9.8, 1500, 1500, 'Children safety at risk')
ON CONFLICT (id) DO NOTHING;

-- ── 6. ISSUE ASSIGNMENTS ──────────────────────────────────────
INSERT INTO public.issue_assignments (issue_id, assigned_type, assigned_ngo_id, assigned_volunteer_id, status) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'ngo', 'b2000000-0000-0000-0000-000000000001', NULL, 'in_progress'),
  ('d4000000-0000-0000-0000-000000000003', 'ngo', 'b2000000-0000-0000-0000-000000000003', NULL, 'assigned'),
  ('d4000000-0000-0000-0000-000000000005', 'volunteer', NULL, 'c3000000-0000-0000-0000-000000000002', 'completed'),
  ('d4000000-0000-0000-0000-000000000006', 'ngo', 'b2000000-0000-0000-0000-000000000001', NULL, 'in_progress'),
  ('d4000000-0000-0000-0000-000000000007', 'volunteer', NULL, 'c3000000-0000-0000-0000-000000000001', 'assigned'),
  ('d4000000-0000-0000-0000-000000000008', 'ngo', 'b2000000-0000-0000-0000-000000000001', NULL, 'in_progress');

-- ── 7. ISSUE UPDATES ──────────────────────────────────────────
INSERT INTO public.issue_updates (issue_id, message, created_at) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'Mumbai CleanUp Foundation has dispatched a team to assess the situation.', NOW() - INTERVAL '2 days'),
  ('d4000000-0000-0000-0000-000000000001', 'Garbage removal in progress. Expected to complete by evening.', NOW() - INTERVAL '1 day'),
  ('d4000000-0000-0000-0000-000000000003', 'Delhi Water Aid has contacted the municipal corporation. Repair team scheduled.', NOW() - INTERVAL '3 days'),
  ('d4000000-0000-0000-0000-000000000005', 'Street lights repaired. All 14 units now operational.', NOW() - INTERVAL '5 days'),
  ('d4000000-0000-0000-0000-000000000006', 'Fogging drive completed. Water drainage work starting tomorrow.', NOW() - INTERVAL '12 hours'),
  ('d4000000-0000-0000-0000-000000000007', 'Volunteer Sneha has arrived on site. Coordinating with traffic police.', NOW() - INTERVAL '6 hours'),
  ('d4000000-0000-0000-0000-000000000008', 'Temporary barricade placed. Permanent cover ordered from BMC warehouse.', NOW() - INTERVAL '1 day');

-- ── 8. ISSUE UPVOTES ──────────────────────────────────────────
INSERT INTO public.issue_upvotes (issue_id, user_id) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002'),
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003'),
  ('d4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001'),
  ('d4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003'),
  ('d4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001'),
  ('d4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002'),
  ('d4000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001'),
  ('d4000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002'),
  ('d4000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003')
ON CONFLICT (issue_id, user_id) DO NOTHING;

-- ── 9. DONATIONS ──────────────────────────────────────────────
INSERT INTO public.donations (issue_id, user_id, amount, payment_status) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 500, 'completed'),
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 2700, 'completed'),
  ('d4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 5000, 'completed'),
  ('d4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 3500, 'completed'),
  ('d4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 1500, 'completed'),
  ('d4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 1800, 'completed'),
  ('d4000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 1000, 'completed'),
  ('d4000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 1500, 'completed');

-- ── 10. CROSS-NGO ALERTS ──────────────────────────────────────
INSERT INTO public.cross_ngo_alerts (issue_id, from_ngo_id, urgency, required_resources, status, message) VALUES
  ('d4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000001', 'critical', ARRAY['fogging_machines','medical_kits'], 'open', 'Dengue cases spiking near Andheri. Need fogging support from nearby NGOs urgently.'),
  ('d4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'high', ARRAY['pipes','pumps','tankers'], 'open', 'Pipeline burst in Dwarka. Need water tankers for 500+ affected families.');

-- ── 11. NGO RESOURCES ─────────────────────────────────────────
INSERT INTO public.ngo_resources (ngo_id, title, category, description, quantity, status) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'Garbage trucks', 'vehicle', 'Municipal garbage collection trucks', 4, 'available'),
  ('b2000000-0000-0000-0000-000000000001', 'Safety gloves (boxes)', 'equipment', 'Industrial cleaning gloves', 25, 'available'),
  ('b2000000-0000-0000-0000-000000000001', 'Fogging machines', 'equipment', 'Mosquito fogging equipment', 2, 'in_use'),
  ('b2000000-0000-0000-0000-000000000002', 'Tree saplings', 'material', 'Native species saplings for plantation drives', 500, 'available'),
  ('b2000000-0000-0000-0000-000000000002', 'Pickup van', 'vehicle', 'Logistics and transport van', 1, 'available'),
  ('b2000000-0000-0000-0000-000000000003', 'Water tankers', 'vehicle', '5000L capacity water tankers', 3, 'in_use'),
  ('b2000000-0000-0000-0000-000000000003', 'PVC pipes (meters)', 'material', 'Replacement pipes for repairs', 200, 'available');

-- ── 12. RESOURCES (inventory tracking) ────────────────────────
INSERT INTO public.resources (id, ngo_id, name, category, unit, total_added, total_used) VALUES
  ('e5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Cleaning kits', 'equipment', 'kit', 100, 45),
  ('e5000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'Waste bags', 'material', 'roll', 500, 320),
  ('e5000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 'Saplings', 'material', 'piece', 1000, 480),
  ('e5000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000003', 'Water purification tablets', 'medical', 'box', 200, 85),
  ('e5000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 'PVC pipes', 'material', 'meter', 500, 200)
ON CONFLICT (id) DO NOTHING;

-- ── 13. RESOURCE TRANSACTIONS ─────────────────────────────────
INSERT INTO public.resource_transactions (resource_id, ngo_id, type, quantity, issue_id, notes, created_at) VALUES
  ('e5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'added', 50, NULL, 'Initial stock from CSR donation', NOW() - INTERVAL '30 days'),
  ('e5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'used', 20, 'd4000000-0000-0000-0000-000000000001', 'Deployed for Dadar cleanup', NOW() - INTERVAL '2 days'),
  ('e5000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'added', 200, NULL, 'Monthly restock', NOW() - INTERVAL '15 days'),
  ('e5000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000003', 'used', 30, 'd4000000-0000-0000-0000-000000000003', 'Distributed to Dwarka residents', NOW() - INTERVAL '3 days'),
  ('e5000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 'used', 100, 'd4000000-0000-0000-0000-000000000003', 'Used for pipeline repair', NOW() - INTERVAL '1 day');

-- ── 14. TASK SUBMISSIONS ──────────────────────────────────────
INSERT INTO public.task_submissions (issue_id, volunteer_id, proof_image_url, description, latitude, longitude, status, verified_by) VALUES
  ('d4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'https://placehold.co/600x400?text=Street+Lights+Fixed', 'All 14 street light units repaired and tested. Attached photo of working lights at night.', 18.5196, 73.8554, 'approved', 'b2000000-0000-0000-0000-000000000002'),
  ('d4000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'https://placehold.co/600x400?text=Tree+Cleared', 'Tree branches cut and cleared from road. Traffic flow restored.', 19.0640, 72.8402, 'pending', NULL),
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'https://placehold.co/600x400?text=Garbage+Cleared', 'Area cleaned. 3 truckloads of garbage removed from Dadar station vicinity.', 19.0178, 72.8478, 'approved', 'b2000000-0000-0000-0000-000000000001');

-- ── 15. NGO APPLICATIONS ──────────────────────────────────────
INSERT INTO public.ngo_applications (user_id, verification_id, org_name, registration_number, contact_email, contact_phone, address, website, description, status, submitted_at) VALUES
  ('a1000000-0000-0000-0000-000000000007', 'LW-VER-2025-0001', 'Mumbai CleanUp Foundation', 'MH-NGO-2019-4521', 'contact@mumcleanup.org', '+91 98765 43210', '45 Parel East, Mumbai 400012', 'https://mumcleanup.org', 'Working on sanitation and waste management across Mumbai since 2019.', 'approved', NOW() - INTERVAL '60 days'),
  ('a1000000-0000-0000-0000-000000000008', 'LW-VER-2025-0002', 'Green Pune Initiative', 'MH-NGO-2020-7893', 'hello@greenpune.org', '+91 87654 32109', '12 Koregaon Park, Pune 411001', 'https://greenpune.org', 'Environmental conservation and tree plantation drives in Pune.', 'approved', NOW() - INTERVAL '45 days'),
  ('a1000000-0000-0000-0000-000000000009', 'LW-VER-2025-0003', 'Delhi Water Aid', 'DL-NGO-2021-1156', 'info@delhiwateraid.org', '+91 76543 21098', '88 Dwarka Sector 12, New Delhi 110078', 'https://delhiwateraid.org', 'Focused on clean water access and pipeline infrastructure in Delhi NCR.', 'approved', NOW() - INTERVAL '30 days')
ON CONFLICT (verification_id) DO NOTHING;

-- Done! ✅
SELECT 'Seed data inserted successfully!' AS result;
