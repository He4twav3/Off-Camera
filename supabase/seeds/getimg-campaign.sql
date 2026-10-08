-- Creates the Getimg campaign, with the contract's pay rules (base pay per post, highest-milestone
-- bonuses, a payment every 15 posts, a 30-day counting window). Run it once, AFTER 0023 has been run.
-- It includes the brand note and the formats that work. Add example videos, and the logo,
-- in Admin > Jobs (use Getimg's own posts, or ones the creator has agreed to share).
-- Afterwards: open Admin > Jobs to attach the Getimg brand account and change anything you want.
-- The niche below is the first one alphabetically; change it in Jobs if another fits better.

insert into jobs (title, about, formats, description, platform, niche_id, payout_type, payout_amount, payout_notes, account_requirement, status, post_terms)
values (
  'Getimg',
  'Getimg is an all-in-one creative AI workspace for generating and editing images, video, music, speech and sound. We are looking for creators who can make high-volume UGC that helps our paid ads stand out and perform better than standard creative. If you create clear, product-led content and can turn a simple feature into a strong ad hook, this is a good fit.',
  'Speed challenge: do something with Getimg in N seconds, no yapping
Step by step: screen-record your build with step-by-step text overlays
Pain-point hook: open with a problem (for example "Tired of your 9 to 5?"), then show what you made
Talking head: on camera, with a bold line of text in the first second',
  'Make clear, product-led content: turn a simple Getimg feature into a strong ad hook
High-volume UGC that helps our paid ads stand out and perform better than standard creative
Post on Instagram, TikTok or YouTube
Keep every post public for 90 days
Every video must be genuinely new: no repeats or bulk posting to fill the count
Use only music, images and fonts you have the rights to
Label every post as a paid partnership (#ad)',
  'tiktok',
  (select id from niches order by label limit 1),
  'flat',
  20,
  'Pays per post, with view bonuses. See the pay terms on this page.',
  'new_ok',
  'open',
  '{"v":2,"basePerPost":20,"cycleSize":15,"milestones":[{"views":1000,"amount":2},{"views":5000,"amount":10},{"views":10000,"amount":20},{"views":100000,"amount":200}],"windowDays":30,"keepPublicDays":90,"platforms":["instagram","tiktok","youtube_shorts"]}'::jsonb
);
