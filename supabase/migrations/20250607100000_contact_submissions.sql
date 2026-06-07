-- Contact & meeting request submissions
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

-- No public read/write — only service role via API
