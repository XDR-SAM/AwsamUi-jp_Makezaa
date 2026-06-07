-- Makezaa CMS schema: posts, projects, storage
-- Run in Supabase SQL Editor or via: supabase db push

-- Posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image text,
  tags text[],
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content text,
  cover_image text,
  tech_stack text[],
  live_url text,
  github_url text,
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.posts enable row level security;
alter table public.projects enable row level security;

-- Public read: published content only
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects for select
  to anon, authenticated
  using (published = true);

-- Grant table access to API roles
grant select on public.posts to anon, authenticated;
grant select on public.projects to anon, authenticated;

-- Storage bucket for blog/project images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public read for images
drop policy if exists "Public can view blog images" on storage.objects;
create policy "Public can view blog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

-- Authenticated users can upload (admin uses service role which bypasses RLS)
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
