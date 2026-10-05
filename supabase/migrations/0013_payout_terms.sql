-- ============================================================================
-- 0013_payout_terms.sql
--
-- Each campaign's payout formula (fixed fee per video, rate per 1,000 views,
-- view-milestone bonuses, per-creator cap, measurement window). Stored as JSON
-- and validated by lib/payout-terms.ts; null means the campaign uses the plain
-- payout_type / payout_amount fields as before. Creator-facing information, so
-- it lives on `jobs` (readable like the rest of the job); the brand's own
-- budget figures are not stored here.
-- ============================================================================

alter table jobs add column payout_terms jsonb;
