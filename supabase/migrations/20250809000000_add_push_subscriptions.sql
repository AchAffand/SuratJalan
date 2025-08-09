-- Create table for Web Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

comment on table public.push_subscriptions is 'Stores browser Web Push subscriptions for notifications';


