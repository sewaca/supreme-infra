import { DragIndicator } from '@mui/icons-material';
import { List, ListItem, TextField } from '@mui/material';
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

  const handleDrop = (toItemId: string) => {
    if (!dragAndDrop.draggedIndex) {
      return;
    }

    const fromIndex = items.findIndex((item) => item.id === dragAndDrop.draggedIndex?.itemId);
    const toIndex = items.findIndex((item) => item.id === toItemId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      dragAndDrop.handleDragEnd();
      return;
    }

    const position = dragAndDrop.dragOverIndex?.position || 'after';
    const reorderedItems = reorderItems(items, fromIndex, toIndex, position);
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

  return (
    <List
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
      onTouchEnd={dragAndDrop.handleTouchEnd}
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
            className={
              isDragOver && dragOverPosition === 'before'
                ? styles.dragOverBefore
                : isDragOver && dragOverPosition === 'after'
                  ? styles.dragOverAfter
                  : ''
            }
            sx={{ opacity: isDragging ? 0.5 : 1, cursor: 'move', position: 'relative', touchAction: 'pan-y' }}
          >
            <div className={styles.number}>
              <TextField
                type="number"
                value={priorityEdit.getEditingValue(item.id, item.priority)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriorityChange(e, item.id)}
                onBlur={() => handlePriorityBlur(item.id)}
                inputProps={{
                  min: 0,
                  max: 99,
                  style: { textAlign: 'center', padding: '4px' },
                  className: styles.numberInput,
                }}
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
            >
              <DragIndicator color="action" />
            </div>
          </ListItem>
        );
      })}
    </List>
  );
};
