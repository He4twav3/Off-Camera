-- ============================================================================
-- 0022_profile_picture_and_discord.sql
--
-- Two small additions to a creator's profile:
--
--   applicants.avatar_url       the profile picture: a link to a file in the
--                               public "avatars" bucket (below).
--   applicants.discord_username the creator's Discord name, typed in. We don't
--                               link the account, so this is just a name.
--
-- Profile pictures live in a public bucket, because a picture is meant to be
-- seen (by brands and by us) and is only reachable by its long random path.
-- Each creator can add, replace and remove files only inside a folder named
-- after their own user id; nobody else can write there. The bucket itself
-- limits files to 2 MB and to common image types.
-- ============================================================================

alter table applicants
  add column avatar_url text
    check (avatar_url is null or (avatar_url ~* '^https://' and length(avatar_url) <= 500)),
  add column discord_username text
    check (discord_username is null or discord_username ~ '^[a-z0-9_.]{2,32}$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Writes only inside your own folder: avatars/<your user id>/<file>.
create policy "avatars: add to own folder"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: replace in own folder"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: remove from own folder"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Anyone may read pictures (the bucket is public), including through the API.
create policy "avatars: public read"
  on storage.objects
  for select
  using (bucket_id = 'avatars');
