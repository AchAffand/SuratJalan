-- Fix: ensure correct enum casting when updating purchase_orders.status
-- and (re)create trigger function for syncing PO progress from delivery_notes

-- 1) Ensure po_status enum exists (idempotent)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'po_status') then
    create type po_status as enum ('Aktif', 'Sebagian', 'Selesai');
  end if;
end$$;

-- 2) (Re)create the trigger function with explicit enum casts
create or replace function public.sync_po_progress_from_delivery_notes()
returns trigger
language plpgsql
security definer
as $$
declare
  affected_po text;
  total_shipped numeric;
begin
  -- Determine which row image to use depending on the operation
  if TG_OP = 'DELETE' then
    affected_po := OLD.po_number;
  else
    affected_po := NEW.po_number;
  end if;

  -- Sum of shipped/net weights for the affected PO
  select coalesce(sum(coalesce(dn.net_weight, 0)), 0)
    into total_shipped
  from public.delivery_notes dn
  where dn.po_number = affected_po;

  -- Update the purchase order aggregates and status with proper enum casts
  update public.purchase_orders po
  set shipped_tonnage = total_shipped,
      remaining_tonnage = greatest(po.total_tonnage - total_shipped, 0),
      status = case
        when total_shipped >= po.total_tonnage then 'Selesai'::po_status
        when total_shipped > 0 then 'Sebagian'::po_status
        else 'Aktif'::po_status
      end,
      updated_at = now()
  where po.po_number = affected_po;

  return coalesce(NEW, OLD);
end;
$$;

-- 3) (Re)create the trigger on delivery_notes
drop trigger if exists trg_sync_po_progress_on_delivery_notes on public.delivery_notes;
create trigger trg_sync_po_progress_on_delivery_notes
after insert or update or delete on public.delivery_notes
for each row execute function public.sync_po_progress_from_delivery_notes();


