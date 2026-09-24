-- Voice memo storage bucket and access policies.
-- Participants upload via authenticated client; signed URLs handle playback.

insert into storage.buckets (id, name, public)
values ('voice-memos', 'voice-memos', false)
on conflict (id) do nothing;

create policy storage_voice_upload
  on storage.objects for insert
  with check (
    bucket_id = 'voice-memos'
    and auth.uid() is not null
  );

create policy storage_voice_read
  on storage.objects for select
  using (
    bucket_id = 'voice-memos'
    and auth.uid() is not null
  );
