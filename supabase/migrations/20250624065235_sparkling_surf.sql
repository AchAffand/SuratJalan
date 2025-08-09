/*
  # Create delivery notes table

  1. New Tables
    - `delivery_notes`
      - `id` (uuid, primary key)
      - `date` (date) - Tanggal pengiriman
      - `vehicle_plate` (text) - Plat nomor kendaraan
      - `driver_name` (text) - Nama sopir
      - `delivery_note_number` (text, unique) - Nomor surat jalan
      - `no_po` (text, nullable) - Nomor PO
      - `destination` (text) - Alamat tujuan
      - `net_weight` (numeric, nullable) - Berat bersih timbangan
      - `status` (enum) - Status pengiriman: menunggu, dalam-perjalanan, selesai
      - `notes` (text, nullable) - Catatan tambahan
      - `created_at` (timestamptz) - Waktu dibuat
      - `updated_at` (timestamptz) - Waktu diperbarui

  2. Security
    - Enable RLS on `delivery_notes` table
    - Add policy for public access (since no authentication required)
    - Add indexes for better performance

  3. Features
    - Auto-update timestamps
    - Unique constraint on delivery note number
    - Status enum for data consistency
*/

-- Create enum for delivery status
CREATE TYPE delivery_status AS ENUM ('menunggu', 'dalam-perjalanan', 'selesai');

-- Create delivery_notes table
CREATE TABLE IF NOT EXISTS delivery_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vehicle_plate text NOT NULL,
  driver_name text NOT NULL,
  delivery_note_number text UNIQUE NOT NULL,
  no_po text NOT NULL,
  destination text NOT NULL,
  net_weight numeric(10,2),
  status delivery_status NOT NULL DEFAULT 'menunggu',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no authentication required)
CREATE POLICY "Allow public access to delivery notes"
  ON delivery_notes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(date);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON delivery_notes(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_updated_at ON delivery_notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_delivery_note_number ON delivery_notes(delivery_note_number);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_delivery_notes_updated_at
  BEFORE UPDATE ON delivery_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();