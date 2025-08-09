import { createClient } from '@supabase/supabase-js';
import { DeliveryNote } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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
          created_at?: string;
          updated_at?: string;
        };
      },
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          po_date: string;
          product_type: 'CPO' | 'UCO' | 'Minyak Ikan';
          total_tonnage: number;
          price_per_ton: number;
          total_value: number;
          status: 'Aktif' | 'Selesai' | 'Sebagian';
          shipped_tonnage: number;
          remaining_tonnage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          po_date: string;
          product_type: 'CPO' | 'UCO' | 'Minyak Ikan';
          total_tonnage: number;
          price_per_ton: number;
          total_value: number;
          status?: 'Aktif' | 'Selesai' | 'Sebagian';
          shipped_tonnage?: number;
          remaining_tonnage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_number?: string;
          po_date?: string;
          product_type?: 'CPO' | 'UCO' | 'Minyak Ikan';
          total_tonnage?: number;
          price_per_ton?: number;
          total_value?: number;
          status?: 'Aktif' | 'Selesai' | 'Sebagian';
          shipped_tonnage?: number;
          remaining_tonnage?: number;
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
  poNumber: dbNote.po_number || '',
  destination: dbNote.destination,
  netWeight: dbNote.net_weight || undefined,
  status: dbNote.status,
  notes: dbNote.notes || undefined,
  createdAt: dbNote.created_at,
  updatedAt: dbNote.updated_at,
});

export const deliveryNoteToDb = (note: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>): Database['public']['Tables']['delivery_notes']['Insert'] => ({
  date: note.date,
  vehicle_plate: note.vehiclePlate,
  driver_name: note.driverName,
  delivery_note_number: note.deliveryNoteNumber,
  po_number: note.poNumber,
  destination: note.destination,
  net_weight: note.netWeight || null,
  status: note.status,
  notes: note.notes || null,
});