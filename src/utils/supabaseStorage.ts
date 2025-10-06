import { supabase, dbToDeliveryNote, deliveryNoteToDb } from '../lib/supabase';
import { DeliveryNote } from '../types';

export const getDeliveryNotesFromSupabase = async (): Promise<DeliveryNote[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching delivery notes:', error);
      throw error;
    }

    return data ? data.map(dbToDeliveryNote) : [];
  } catch (error) {
    console.error('Error loading delivery notes from Supabase:', error);
    throw error;
  }
};

export const addDeliveryNoteToSupabase = async (note: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryNote> => {
  try {
    const dbNote = deliveryNoteToDb(note);
    
    const { data, error } = await supabase
      .from('delivery_notes')
      .insert([dbNote])
      .select()
      .single();

    if (error) {
      console.error('Error adding delivery note:', error);
      throw error;
    }

    return dbToDeliveryNote(data);
  } catch (error) {
    console.error('Error saving delivery note to Supabase:', error);
    throw error;
  }
};

export const updateDeliveryNoteInSupabase = async (id: string, updates: Partial<DeliveryNote>): Promise<DeliveryNote | null> => {
  try {
    // FIX: Use proper typing instead of any
    const dbUpdates: Partial<Database['public']['Tables']['delivery_notes']['Update']> = {};
    
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.vehiclePlate !== undefined) dbUpdates.vehicle_plate = updates.vehiclePlate;
    if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
    if (updates.deliveryNoteNumber !== undefined) dbUpdates.delivery_note_number = updates.deliveryNoteNumber;
    if (updates.poNumber !== undefined) dbUpdates.po_number = updates.poNumber || null;
    if (updates.destination !== undefined) dbUpdates.destination = updates.destination;
    if (updates.netWeight !== undefined) dbUpdates.net_weight = updates.netWeight || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.hasSeal !== undefined) dbUpdates.has_seal = updates.hasSeal;
    if (updates.sealNumbers !== undefined) dbUpdates.seal_numbers = updates.sealNumbers || [];
    if (updates.company !== undefined) {
      try {
        dbUpdates.company = updates.company;
      } catch (error) {
        console.warn('Company field not available in database yet:', error);
      }
    }
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('delivery_notes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery note:', error);
      throw error;
    }

    return data ? dbToDeliveryNote(data) : null;
  } catch (error) {
    console.error('Error updating delivery note in Supabase:', error);
    throw error;
  }
};

export const deleteDeliveryNoteFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('delivery_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting delivery note:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting delivery note from Supabase:', error);
    throw error;
  }
};

export const getPurchaseOrdersFromSupabase = async (): Promise<{
  id: string;
  po_number: string;
  po_date: string;
  product_type: string;
  total_tonnage: number;
  price_per_ton: number;
  total_value: number;
  shipped_tonnage: number;
  remaining_tonnage: number;
  status: string;
  buyer_name?: string | null;
  buyer_address?: string | null;
  created_at: string;
  updated_at: string;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('id, po_number, po_date, product_type, total_tonnage, price_per_ton, total_value, shipped_tonnage, remaining_tonnage, status, buyer_name, buyer_address, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error loading purchase orders from Supabase:', error);
    throw error;
  }
};