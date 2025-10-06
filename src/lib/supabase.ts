import { createClient } from '@supabase/supabase-js';
import { DeliveryNote } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create a .env file in your project root with:');
  console.error('VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('');
  console.error('You can find these values in your Supabase project dashboard:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Settings > API');
  console.error('4. Copy the Project URL and anon/public key');
  
  throw new Error('Missing Supabase environment variables. Please check the console for setup instructions.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      delivery_notes: {
        Row: {
          id: string;
          date: string;
          vehicle_plate: string;
          driver_name: string;
          delivery_note_number: string;
          destination: string;
          po_number: string | null;
          net_weight: number | null;
          status: 'menunggu' | 'dalam-perjalanan' | 'selesai';
          notes: string | null;
        has_seal: boolean;
        seal_numbers: string[];
        company?: 'sbs' | 'mbs' | 'perorangan';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          vehicle_plate: string;
          driver_name: string;
          delivery_note_number: string;
          destination: string;
          po_number: string | null;
          net_weight?: number | null;
          status?: 'menunggu' | 'dalam-perjalanan' | 'selesai';
          notes?: string | null;
          has_seal?: boolean;
          seal_numbers?: string[];
          company?: 'sbs' | 'mbs' | 'perorangan';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          vehicle_plate?: string;
          driver_name?: string;
          delivery_note_number?: string;
          destination?: string;
          po_number?: string | null;
          net_weight?: number | null;
          status?: 'menunggu' | 'dalam-perjalanan' | 'selesai';
          notes?: string | null;
          has_seal?: boolean;
          seal_numbers?: string[];
          company?: 'sbs' | 'mbs' | 'perorangan';
          created_at?: string;
          updated_at?: string;
        };
      },
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          po_date: string;
          buyer_name: string | null;
          buyer_address: string | null;
          buyer_phone: string | null;
          buyer_email: string | null;
          product_type: 'CPO' | 'UCO' | 'Minyak Ikan' | string;
          total_tonnage: number;
          price_per_ton: number;
          total_value: number;
          status: 'Aktif' | 'Selesai' | 'Sebagian' | 'Terlambat' | 'Dibatalkan';
          shipped_tonnage: number;
          remaining_tonnage: number;
          delivery_deadline: string | null;
          payment_terms: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          po_date: string;
          buyer_name?: string | null;
          buyer_address?: string | null;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          product_type: 'CPO' | 'UCO' | 'Minyak Ikan' | string;
          total_tonnage: number;
          price_per_ton: number;
          total_value: number;
          status?: 'Aktif' | 'Selesai' | 'Sebagian' | 'Terlambat' | 'Dibatalkan';
          shipped_tonnage?: number;
          remaining_tonnage?: number;
          delivery_deadline?: string | null;
          payment_terms?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_number?: string;
          po_date?: string;
          buyer_name?: string | null;
          buyer_address?: string | null;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          product_type?: 'CPO' | 'UCO' | 'Minyak Ikan' | string;
          total_tonnage?: number;
          price_per_ton?: number;
          total_value?: number;
          status?: 'Aktif' | 'Selesai' | 'Sebagian' | 'Terlambat' | 'Dibatalkan';
          shipped_tonnage?: number;
          remaining_tonnage?: number;
          delivery_deadline?: string | null;
          payment_terms?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      },
      destinations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      }
    };
  };
};

// Helper functions to convert between database format and app format
export const dbToDeliveryNote = (dbNote: Database['public']['Tables']['delivery_notes']['Row']): DeliveryNote => ({
  id: dbNote.id,
  date: dbNote.date,
  vehiclePlate: dbNote.vehicle_plate,
  driverName: dbNote.driver_name,
  deliveryNoteNumber: dbNote.delivery_note_number,
  poNumber: dbNote.po_number || null, // FIX: Konsisten dengan database schema
  destination: dbNote.destination,
  netWeight: dbNote.net_weight || undefined,
  status: dbNote.status,
  notes: dbNote.notes || undefined,
  hasSeal: dbNote.has_seal || false,
  sealNumbers: dbNote.seal_numbers || [],
  company: dbNote.company || 'sbs',
  createdAt: dbNote.created_at,
  updatedAt: dbNote.updated_at,
});

export const deliveryNoteToDb = (note: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>): Database['public']['Tables']['delivery_notes']['Insert'] => ({
  date: note.date,
  vehicle_plate: note.vehiclePlate,
  driver_name: note.driverName,
  delivery_note_number: note.deliveryNoteNumber,
  po_number: note.poNumber || null, // FIX: Handle empty string dan null dengan konsisten
  destination: note.destination,
  net_weight: note.netWeight || null,
  status: note.status,
  notes: note.notes || null,
  has_seal: note.hasSeal || false,
  seal_numbers: note.sealNumbers || [],
  company: note.company || 'sbs',
});