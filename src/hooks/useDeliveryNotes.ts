import { useState, useEffect, useRef } from 'react';
import { DeliveryNote, DeliveryStats } from '../types';
import { 
  getDeliveryNotesFromSupabase, 
  addDeliveryNoteToSupabase, 
  updateDeliveryNoteInSupabase, 
  deleteDeliveryNoteFromSupabase 
} from '../utils/supabaseStorage';
// Removed shouldAutoUpdateStatus import - no more automatic status updates
import { supabase } from '../lib/supabase';
import { useDebouncedCallback } from './useDebounce';

export const useDeliveryNotes = () => {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Removed autoUpdateStatuses - status updates now only happen when printing

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedNotes = await getDeliveryNotesFromSupabase();
      setNotes(loadedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Gagal memuat data surat jalan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // Removed automatic status update interval - status updates now only happen when printing
  }, []);

  const createNote = async (noteData: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      // Always create with 'menunggu' status - no automatic status updates
      const newNote = await addDeliveryNoteToSupabase({ ...noteData, status: 'menunggu' });
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Gagal menyimpan surat jalan. Periksa koneksi internet Anda.');
      throw err;
    }
  };

  const updateNote = async (id: string, updates: Partial<DeliveryNote>) => {
    try {
      setError(null);
      
      // OPTIMISTIC UPDATE: Update UI immediately for better UX
      const oldNote = notes.find(n => n.id === id);
      if (!oldNote) {
        throw new Error('Note tidak ditemukan');
      }
      
      const optimisticNote = { ...oldNote, ...updates, updatedAt: new Date().toISOString() };
      setNotes(prev => prev.map(note => note.id === id ? optimisticNote : note));
      
      // Prepare for atomic operations
      const oldPONumber = oldNote.poNumber;
      const newPONumber = updates.poNumber === '-' ? null : updates.poNumber;
      
      // Actual database update
      const updatedNote = await updateDeliveryNoteInSupabase(id, updates);
      if (updatedNote) {
        // Replace optimistic update with server data
        setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
        // Jika poNumber berubah, update saldo PO lama dan PO baru
        if (oldPONumber !== newPONumber) {
          // Update saldo PO lama
          if (oldPONumber) {
            const allNotes = await getDeliveryNotesFromSupabase();
            const notesForOldPO = allNotes.filter(n => n.poNumber === oldPONumber);
            const totalShipped = notesForOldPO.reduce((sum, n) => sum + (n.netWeight || 0), 0);
            // Update PO lama
            const { data: oldPO } = await supabase
              .from('purchase_orders')
              .select('id, total_tonnage')
              .eq('po_number', oldPONumber)
              .single();
            if (oldPO) {
              const remaining = oldPO.total_tonnage - totalShipped;
              let status = 'Aktif';
              if (totalShipped >= oldPO.total_tonnage) status = 'Selesai';
              else if (totalShipped > 0) status = 'Sebagian';
              await supabase
                .from('purchase_orders')
                .update({
                  shipped_tonnage: totalShipped,
                  remaining_tonnage: remaining > 0 ? remaining : 0,
                  status
                })
                .eq('id', oldPO.id);
            }
          }
          // Update saldo PO baru
          if (newPONumber) {
            const allNotes = await getDeliveryNotesFromSupabase();
            const notesForNewPO = allNotes.filter(n => n.poNumber === newPONumber);
            const totalShipped = notesForNewPO.reduce((sum, n) => sum + (n.netWeight || 0), 0);
            // Update PO baru
            const { data: newPO } = await supabase
              .from('purchase_orders')
              .select('id, total_tonnage')
              .eq('po_number', newPONumber)
              .single();
            if (newPO) {
              const remaining = newPO.total_tonnage - totalShipped;
              let status = 'Aktif';
              if (totalShipped >= newPO.total_tonnage) status = 'Selesai';
              else if (totalShipped > 0) status = 'Sebagian';
              await supabase
                .from('purchase_orders')
                .update({
                  shipped_tonnage: totalShipped,
                  remaining_tonnage: remaining > 0 ? remaining : 0,
                  status
                })
                .eq('id', newPO.id);
            }
          }
        }
      }
      return updatedNote;
    } catch (err) {
      console.error('❌ Error updating note:', err);
      
      // ROLLBACK: Revert optimistic update on error
      setNotes(prev => prev.map(note => 
        note.id === id ? (oldNote || note) : note
      ));
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Gagal memperbarui surat jalan: ${errorMessage}`);
      throw err;
    }
  };

  // DEBOUNCED UPDATE: Prevent race conditions from rapid updates
  const debouncedUpdateNote = useDebouncedCallback(updateNote, 300);

  // BATCH UPDATE: For multiple field updates
  const batchUpdateNote = async (id: string, updates: Partial<DeliveryNote>) => {
    // Use regular updateNote for immediate updates that need to be atomic
    return updateNote(id, updates);
  };

  const removeNote = async (id: string) => {
    try {
      setError(null);
      const success = await deleteDeliveryNoteFromSupabase(id);
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== id));
      }
      return success;
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Gagal menghapus surat jalan. Periksa koneksi internet Anda.');
      throw err;
    }
  };

  const getStats = (): DeliveryStats => {
    return {
      total: notes.length,
      menunggu: notes.filter(note => note.status === 'menunggu').length,
      dalamPerjalanan: notes.filter(note => note.status === 'dalam-perjalanan').length,
      selesai: notes.filter(note => note.status === 'selesai').length,
      totalWeight: notes.reduce((sum, note) => sum + (note.netWeight || 0), 0),
    };
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    debouncedUpdateNote, // For form inputs that change frequently
    batchUpdateNote,     // For multiple field updates
    removeNote,
    getStats,
    refreshNotes: loadNotes,
  };
};