-- Migration: Add destinations table for global address management
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public access (tanpa auth, sama seperti delivery_notes)
CREATE POLICY "Allow public access to destinations"
  ON destinations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true); 