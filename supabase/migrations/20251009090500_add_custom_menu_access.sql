-- Add custom_menu_access column to app_users for per-user menu control
alter table public.app_users
  add column if not exists custom_menu_access text[] default '{}'::text[];


