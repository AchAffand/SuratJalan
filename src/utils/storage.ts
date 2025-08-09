import { DeliveryNote } from '../types';

const STORAGE_KEY = 'delivery-notes';

export const getDeliveryNotes = (): DeliveryNote[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading delivery notes:', error);
    return [];
  }
};

export const saveDeliveryNotes = (notes: DeliveryNote[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving delivery notes:', error);
  }
};

export const addDeliveryNote = (note: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>): DeliveryNote => {
  const notes = getDeliveryNotes();
  const newNote: DeliveryNote = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  notes.push(newNote);
  saveDeliveryNotes(notes);
  return newNote;
};

export const updateDeliveryNote = (id: string, updates: Partial<DeliveryNote>): DeliveryNote | null => {
  const notes = getDeliveryNotes();
  const index = notes.findIndex(note => note.id === id);
  
  if (index === -1) return null;
  
  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveDeliveryNotes(notes);
  return notes[index];
};

export const deleteDeliveryNote = (id: string): boolean => {
  const notes = getDeliveryNotes();
  const filteredNotes = notes.filter(note => note.id !== id);
  
  if (filteredNotes.length === notes.length) return false;
  
  saveDeliveryNotes(filteredNotes);
  return true;
};