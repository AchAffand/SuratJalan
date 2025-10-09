-- Create global app_users table for application-managed accounts
-- Note: This is a simple implementation using plaintext passwords for internal use.
-- For production, switch to Supabase Auth or store password hashes.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  role text not null check (role in ('administrator','supervisor','operator','driver')),
  password text not null,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS and open policies for now (client-only app). Tighten later if needed.
alter table public.app_users enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'app_users' and policyname = 'Allow all on app_users'
  ) then
    create policy "Allow all on app_users" on public.app_users
      for all using (true) with check (true);
  end if;
end $$;

-- Seed defaults only if table is empty
insert into public.app_users (username, name, role, password, email)
select * from (
  values
    ('admin','Administrator','administrator','admin123','admin@example.com'),
    ('supervisor','Supervisor Operasional','supervisor','supervisor123','supervisor@example.com'),
    ('operator','Operator Pengiriman','operator','operator123','operator@example.com'),
    ('driver','Driver','driver','driver123','driver@example.com')
) as seed(username, name, role, password, email)
where not exists (select 1 from public.app_users);


