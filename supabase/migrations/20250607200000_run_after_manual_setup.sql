-- Run this AFTER your manual posts/projects setup.
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS where needed).

-- ─── 1. Let the public site read published posts & projects ───
-- Without these GRANTs, /blog and /projects stay empty even when published=true.
grant select on public.posts to anon, authenticated;
grant select on public.projects to anon, authenticated;

-- Optional: tighten policies to anon + authenticated (your old policies still work)
drop policy if exists "Public can view published posts" on public.posts;
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Public can view published projects" on public.projects;
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects for select
  to anon, authenticated
  using (published = true);

-- ─── 2. Contact & meeting inbox (admin dashboard) ───
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('meeting', 'contact')),
  name text not null,
  email text not null,
  company text,
  message text,
  preferred_date date,
  preferred_time text,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;
-- No policies = no public access. Admin API uses service_role only.

-- ─── 3. Image uploads (cover images in admin) ───
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view blog images" on storage.objects;
create policy "Public can view blog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

drop policy if exists "Authenticated can upload blog images" on storage.objects;
create policy "Authenticated can upload blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated can update blog images" on storage.objects;
create policy "Authenticated can update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated can delete blog images" on storage.objects;
create policy "Authenticated can delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');
