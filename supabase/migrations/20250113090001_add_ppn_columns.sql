-- Add PPN columns to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN ppn_enabled BOOLEAN DEFAULT true,
ADD COLUMN ppn_rate DECIMAL(5,4) DEFAULT 0.11;
