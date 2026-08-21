-- ============================================================================
-- seed.sql
-- Run after migrations. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================================

-- Editable niche list (spec requires this be editable, not a hardcoded enum).
insert into niches (slug, label) values
  ('crypto', 'Crypto'),
  ('igaming', 'iGaming'),
  ('finance', 'Finance'),
  ('beauty', 'Beauty'),
  ('fitness', 'Fitness'),
  ('gaming', 'Gaming'),
  ('ecommerce', 'E-commerce'),
  ('other', 'Other')
on conflict (slug) do nothing;

-- This is the ONLY place admin access is granted; there's no admin-panel UI
-- for it by design. See README "Admin access" section.
insert into admin_emails (email) values
  ('aronzekir@gmail.com'),
  ('arnisazekir@gmail.com')
on conflict (email) do nothing;

-- A few sample jobs so /jobs isn't empty in local dev. Delete these once you
-- start entering real campaigns via /admin/jobs. `jobs.title` has no unique
-- constraint (two real campaigns could share a title), so idempotency here is
-- via NOT EXISTS on title rather than ON CONFLICT.
insert into jobs (title, description, platform, niche_id, payout_type, payout_amount, payout_notes, account_requirement, status)
select
  v.title, v.description, v.platform::platform_enum, n.id, v.payout_type::payout_type_enum, v.payout_amount, v.payout_notes, v.account_requirement::account_requirement_enum, v.status::job_status_enum
from (
  values
    ('Crypto exchange app walkthrough', 'Short-form walkthrough of a crypto trading app''s onboarding flow. Full brand details shared after assignment.', 'tiktok', 'crypto', 'flat', 150.00, 'Paid per approved video, 2 revisions included', 'new_ok', 'open'),
    ('Fitness app UGC testimonial', 'Casual talking-head testimonial about a fitness tracking app. Script guidance provided.', 'instagram', 'fitness', 'flat', 120.00, null, 'new_ok', 'open'),
    ('Online casino unboxing-style promo', 'Energetic promo-style short for an online gaming platform.', 'youtube_shorts', 'igaming', 'cpm', 8.00, 'CPM based on verified views, paid monthly', 'established_required', 'open'),
    ('Beauty subscription box review', 'Authentic review-style video for a monthly beauty box brand.', 'tiktok', 'beauty', 'flat', 90.00, null, 'new_ok', 'open')
) as v(title, description, platform, niche_slug, payout_type, payout_amount, payout_notes, account_requirement, status)
join niches n on n.slug = v.niche_slug
where not exists (select 1 from jobs j where j.title = v.title);
