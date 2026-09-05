
CREATE POLICY "own inspection images read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own inspection images insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own inspection images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Private storage bucket for inspection images. Object paths must begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public) values ('inspection-images', 'inspection-images', false)
on conflict (id) do update set public = false;

create policy "own inspection images update" on storage.objects for update to authenticated
  using (bucket_id = 'inspection-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'inspection-images' and auth.uid()::text = (storage.foldername(name))[1]);
