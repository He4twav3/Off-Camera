-- ============================================================================
-- 0015_affiliate_link.sql
--
-- A campaign can include an affiliate link from the brand (most brands make
-- theirs in Dub). Optional; assigned creators see it with the brief. The brand
-- runs the affiliate program and any commission, not us.
-- ============================================================================

alter table jobs add column affiliate_url text;
