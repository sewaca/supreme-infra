import { useState } from 'react';
import type { EditingPriorityState } from '../types';

export const usePriorityEdit = () => {
  const [editingPriority, setEditingPriority] = useState<EditingPriorityState>(null);

  const startEditing = (itemId: string, value: string) => {
    setEditingPriority({ itemId, value });
  };

  const stopEditing = () => {
    setEditingPriority(null);
  };

  const getEditingValue = (itemId: string, currentValue: number): string | number => {
    if (editingPriority?.itemId === itemId) {
      return editingPriority.value;
    }
    return currentValue;
  };

  const isEditing = (itemId: string): boolean => {
    return editingPriority?.itemId === itemId;
  };

  return {
    editingPriority,
    startEditing,
    stopEditing,
    getEditingValue,
    isEditing,
  };
};
