-- ============================================================================
-- 0014_sample_video.sql
--
-- Campaigns can ask applicants for a sample video, shared as a Google Drive
-- link. `jobs.sample_required` turns the request on and `sample_criteria` says
-- what the brand wants to see; the creator's link is stored on the application.
-- ============================================================================

alter table jobs
  add column sample_required boolean not null default false,
  add column sample_criteria text;

alter table applications
  add column sample_url text;
