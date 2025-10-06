-- Add PPN fields to purchase_orders table
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS ppn_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ppn_rate NUMERIC(5,4) DEFAULT 0.11;

-- Add comment for documentation
COMMENT ON COLUMN public.purchase_orders.ppn_enabled IS 'Whether PPN (VAT) is enabled for this PO';
COMMENT ON COLUMN public.purchase_orders.ppn_rate IS 'PPN rate as decimal (0.11 = 11%)';
