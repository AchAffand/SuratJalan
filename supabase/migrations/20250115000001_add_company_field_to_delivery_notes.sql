-- Add company field to delivery_notes table
ALTER TABLE "public"."delivery_notes" 
ADD COLUMN "company" text NOT NULL DEFAULT 'sbs';

-- Add check constraint
ALTER TABLE "public"."delivery_notes" 
ADD CONSTRAINT "delivery_notes_company_check" 
CHECK (company IN ('sbs', 'mbs', 'perorangan'));
