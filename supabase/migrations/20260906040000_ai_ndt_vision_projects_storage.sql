-- AI-NDT Vision projects and private project drive.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code)
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','manager','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  folder text not null check (folder in ('source-images','inspection-data','reports','documents')),
  name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspections
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_projects_owner_updated
  on public.projects(owner_id, updated_at desc);

create index if not exists idx_project_members_user
  on public.project_members(user_id);

create index if not exists idx_project_files_project_created
  on public.project_files(project_id, created_at desc);

create index if not exists idx_inspections_project
  on public.inspections(project_id, created_at desc);

insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'project-files',
    'project-files',
    false,
    52428800,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/zip',
      'application/octet-stream'
    ]::text[]
  )
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_files enable row level security;
alter table public.inspections enable row level security;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
  );
$$;

revoke execute on function public.can_access_project(uuid) from public, anon, authenticated;
grant execute on function public.can_access_project(uuid) to authenticated;

drop policy if exists projects_select on public.projects;
create policy projects_select
  on public.projects for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = id and pm.user_id = auth.uid()
    )
  );

drop policy if exists projects_insert on public.projects;
create policy projects_insert
  on public.projects for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists projects_update on public.projects;
create policy projects_update
  on public.projects for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists projects_delete on public.projects;
create policy projects_delete
  on public.projects for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists project_files_select on public.project_files;
create policy project_files_select
  on public.project_files for select
  to authenticated
  using (public.can_access_project(project_id));

drop policy if exists project_files_insert on public.project_files;
create policy project_files_insert
  on public.project_files for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and public.can_access_project(project_id)
  );

drop policy if exists project_files_update on public.project_files;
create policy project_files_update
  on public.project_files for update
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and public.can_access_project(project_id)
  );

drop policy if exists project_files_delete on public.project_files;
create policy project_files_delete
  on public.project_files for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists inspections_select on public.inspections;
create policy inspections_select
  on public.inspections for select
  to authenticated
  using (
    auth.uid() = user_id
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists inspections_insert on public.inspections;
create policy inspections_insert
  on public.inspections for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (project_id is null or public.can_access_project(project_id))
  );

drop policy if exists inspections_update on public.inspections;
create policy inspections_update
  on public.inspections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists inspections_delete on public.inspections;
create policy inspections_delete
  on public.inspections for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists project_storage_select on storage.objects;
create policy project_storage_select
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(
      nullif((storage.foldername(name))[2], '')::uuid
    )
  );

drop policy if exists project_storage_insert on storage.objects;
create policy project_storage_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(
      nullif((storage.foldername(name))[2], '')::uuid
    )
  );

drop policy if exists project_storage_update on storage.objects;
create policy project_storage_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(
      nullif((storage.foldername(name))[2], '')::uuid
    )
  )
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(
      nullif((storage.foldername(name))[2], '')::uuid
    )
  );

drop policy if exists project_storage_delete on storage.objects;
create policy project_storage_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_access_project(
      nullif((storage.foldername(name))[2], '')::uuid
    )
  );

grant select, insert, update, delete
  on public.projects, public.project_members, public.project_files
  to authenticated;
