-- Add buyer fields and other optional metadata to purchase_orders
-- Also ensure delivery_notes has po_number column (rename from no_po if needed)

-- 1) Ensure delivery_notes.po_number exists (rename from no_po if previous name)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'delivery_notes' and column_name = 'no_po'
  ) and not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'delivery_notes' and column_name = 'po_number'
  ) then
    execute 'alter table public.delivery_notes rename column no_po to po_number';
  end if;
end$$;

-- 2) Add helpful index for joins/aggregations
create index if not exists idx_delivery_notes_po_number on public.delivery_notes(po_number);

-- 3) Add buyer and metadata columns on purchase_orders (idempotent)
alter table public.purchase_orders
  add column if not exists buyer_name text,
  add column if not exists buyer_address text,
  add column if not exists buyer_phone text,
  add column if not exists buyer_email text,
  add column if not exists delivery_deadline date,
  add column if not exists payment_terms text,
  add column if not exists notes text;

-- 4) Ensure shipped/remaining exist and defaults (safe if already present)
alter table public.purchase_orders
  add column if not exists shipped_tonnage numeric default 0,
  add column if not exists remaining_tonnage numeric default 0;


