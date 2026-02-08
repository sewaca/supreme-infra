import { DragIndicator } from '@mui/icons-material';
import { List, ListItem, TextField } from '@mui/material';
import { useEffect, useRef } from 'react';
import { reorderItems, updatePriorityAndSort } from './lib/reorder-utils';
import { useDragAndDrop } from './lib/use-drag-and-drop';
import { usePriorityEdit } from './lib/use-priority-edit';
import styles from './SortedList.module.css';
import type { SortableItem } from './types';

type SortedListProps<T extends SortableItem> = {
  items: T[];
  onItemsChange: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
};

export const SortedList = <T extends SortableItem>({ items, onItemsChange, renderItem }: SortedListProps<T>) => {
  const dragAndDrop = useDragAndDrop();
  const priorityEdit = usePriorityEdit();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (dragAndDrop.draggedIndex) {
        e.preventDefault();
      }
    };

    listElement.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      listElement.removeEventListener('touchmove', handleTouchMove);
    };
  }, [dragAndDrop.draggedIndex]);

  const handleDrop = (toItemId: string, fromItemId?: string, position?: 'before' | 'after') => {
    const draggedItemId = fromItemId || dragAndDrop.draggedIndex?.itemId;
    if (!draggedItemId) {
      return;
    }

    const fromIndex = items.findIndex((item) => item.id === draggedItemId);
    const toIndex = items.findIndex((item) => item.id === toItemId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      dragAndDrop.handleDragEnd();
      return;
    }

    const dropPosition = position || dragAndDrop.dragOverIndex?.position || 'after';
    const reorderedItems = reorderItems(items, fromIndex, toIndex, dropPosition);
    onItemsChange(reorderedItems);
    dragAndDrop.handleDragEnd();
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    priorityEdit.startEditing(itemId, e.target.value);
  };

  const handlePriorityBlur = (itemId: string) => {
    if (!priorityEdit.isEditing(itemId)) {
      priorityEdit.stopEditing();
      return;
    }

    const editingValue = priorityEdit.editingPriority?.value || '';
    const numValue = parseInt(editingValue, 10);

    // Если значение невалидное или пустое, восстанавливаем исходное значение
    if (editingValue === '' || Number.isNaN(numValue)) {
      priorityEdit.stopEditing();
      return;
    }

    // Ограничиваем значения от 0 до 99
    const clampedValue = Math.max(0, Math.min(99, numValue));

    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const updatedItems = updatePriorityAndSort(items, itemIndex, clampedValue);
      onItemsChange(updatedItems);
    }

    priorityEdit.stopEditing();
  };

  const handleTouchEnd = () => {
    const result = dragAndDrop.handleTouchEnd();
    if (result.wasDragging && result.draggedItemId && result.targetItemId && result.position) {
      handleDrop(result.targetItemId, result.draggedItemId, result.position);
    }
  };

  return (
    <List
      ref={listRef}
      onDragOver={(e) => {
        if (dragAndDrop.draggedIndex) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragAndDrop.handleDragEnd();
      }}
      onTouchMove={dragAndDrop.handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={dragAndDrop.handleTouchCancel}
      sx={{ touchAction: 'pan-y' }}
    >
      {items.map((item) => {
        const isDragging = dragAndDrop.draggedIndex?.itemId === item.id;
        const isDragOver = dragAndDrop.dragOverIndex?.itemId === item.id;
        const dragOverPosition =
          dragAndDrop.dragOverIndex?.itemId === item.id ? dragAndDrop.dragOverIndex.position : null;

        return (
          <ListItem
            key={item.id}
            data-item-id={item.id}
            draggable
            onDragStart={() => dragAndDrop.handleDragStart(item.id)}
            onDragOver={(e) => dragAndDrop.handleDragOver(e, item.id)}
            onDragLeave={dragAndDrop.handleDragLeave}
            onDrop={() => handleDrop(item.id)}
            onDragEnd={dragAndDrop.handleDragEnd}
            onTouchStart={(e) => dragAndDrop.handleTouchStart(e, item.id, styles.dragHandle)}
            className={`${
              isDragOver && dragOverPosition === 'before'
                ? styles.dragOverBefore
                : isDragOver && dragOverPosition === 'after'
                  ? styles.dragOverAfter
                  : ''
            } ${isDragging ? styles.dragging : ''}`}
            sx={{ cursor: 'move', position: 'relative', touchAction: 'pan-y' }}
          >
            <div className={styles.number} data-tour={item.priority === 1 ? 'priority-input' : undefined}>
              <TextField
                type="number"
                value={priorityEdit.getEditingValue(item.id, item.priority)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriorityChange(e, item.id)}
                onBlur={() => handlePriorityBlur(item.id)}
                inputProps={{ style: { textAlign: 'center', padding: '4px' }, className: styles.numberInput }}
                sx={{
                  width: '40px',
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    '& input': {
                      padding: '4px',
                      textAlign: 'center',
                      fontSize: '14px',
                      MozAppearance: 'textfield',
                      '&::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                      '&::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                    },
                  },
                }}
                size="small"
                id={`priority-edit-${item.id}`}
              />
            </div>
            {renderItem(item)}
            <div
              className={styles.dragHandle}
              onTouchStart={(e) => dragAndDrop.handleDragHandleTouchStart(e, item.id)}
              style={{ touchAction: 'none' }}
              data-tour={item.priority === 1 ? 'drag-handle' : undefined}
            >
              <DragIndicator color="action" />
            </div>
          </ListItem>
        );
      })}
    </List>
  );
};
