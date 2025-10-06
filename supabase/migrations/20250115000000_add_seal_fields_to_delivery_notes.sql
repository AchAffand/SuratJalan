-- Add seal fields to delivery_notes table
ALTER TABLE delivery_notes 
ADD COLUMN has_seal BOOLEAN DEFAULT FALSE,
ADD COLUMN seal_numbers TEXT[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN delivery_notes.has_seal IS 'Whether the delivery note uses seals';
COMMENT ON COLUMN delivery_notes.seal_numbers IS 'Array of seal numbers used for this delivery';

