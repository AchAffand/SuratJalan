import { useState, useEffect } from 'react';
import { DeliveryNote, DeliveryStats } from '../types';
import { 
  getDeliveryNotesFromSupabase, 
  addDeliveryNoteToSupabase, 
  updateDeliveryNoteInSupabase, 
  deleteDeliveryNoteFromSupabase 
} from '../utils/supabaseStorage';
import { shouldAutoUpdateStatus } from '../utils/format';
import { supabase } from '../lib/supabase';

export const useDeliveryNotes = () => {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const autoUpdateStatuses = (notes: DeliveryNote[]): DeliveryNote[] => {
    return notes.map(note => {
      if (note.status === 'menunggu' && shouldAutoUpdateStatus(note.date)) {
        return {
          ...note,
          status: 'dalam-perjalanan' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    });
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedNotes = await getDeliveryNotesFromSupabase();
      const updatedNotes = autoUpdateStatuses(loadedNotes);
      
      // Update status in database if any status was auto-updated
      for (const note of updatedNotes) {
        const original = loadedNotes.find(n => n.id === note.id);
        if (original && original.status !== note.status) {
          await updateDeliveryNoteInSupabase(note.id, { status: note.status });
        }
      }
      
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Gagal memuat data surat jalan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    
    // Check for status updates every minute
    const interval = setInterval(async () => {
      try {
        const currentNotes = await getDeliveryNotesFromSupabase();
        const updatedNotes = autoUpdateStatuses(currentNotes);
        
        if (JSON.stringify(currentNotes) !== JSON.stringify(updatedNotes)) {
          setNotes(updatedNotes);
          for (const note of updatedNotes) {
            const original = currentNotes.find(n => n.id === note.id);
            if (original && original.status !== note.status) {
              await updateDeliveryNoteInSupabase(note.id, { status: note.status });
            }
          }
        }
      } catch (err) {
        console.error('Error in auto-update:', err);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const createNote = async (noteData: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      // Auto-set status based on delivery date
      let status = noteData.status;
      if (status === 'menunggu' && shouldAutoUpdateStatus(noteData.date)) {
        status = 'dalam-perjalanan';
      }
      
      const newNote = await addDeliveryNoteToSupabase({ ...noteData, status });
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
      // Ambil note lama sebelum update
      const oldNote = notes.find(n => n.id === id);
      const oldPONumber = oldNote?.poNumber;
      const newPONumber = updates.poNumber === '-' ? null : updates.poNumber;
      const updatedNote = await updateDeliveryNoteInSupabase(id, updates);
      if (updatedNote) {
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
      console.error('Error updating note:', err);
      setError('Gagal memperbarui surat jalan. Periksa koneksi internet Anda.');
      throw err;
    }
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
    removeNote,
    getStats,
    refreshNotes: loadNotes,
  };
};