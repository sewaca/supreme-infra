import { useRef, useState } from 'react';
import type { DragOverState, DragState } from '../types';

const DRAG_THRESHOLD = 10;

export const useDragAndDrop = () => {
  const [draggedIndex, setDraggedIndex] = useState<DragState>(null);
  const [dragOverIndex, setDragOverIndex] = useState<DragOverState>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartItemId = useRef<string | null>(null);
  const isDragging = useRef<boolean>(false);
  const touchStartElement = useRef<HTMLElement | null>(null);

  const handleDragStart = (itemId: string) => {
    setDraggedIndex({ itemId });
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    if (draggedIndex) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const position = y < height / 2 ? 'before' : 'after';

      setDragOverIndex({ itemId, position });
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: string, dragHandleClassName: string) => {
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest(`.${dragHandleClassName}`) !== null;

    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartItemId.current = itemId;
    touchStartElement.current = e.currentTarget as HTMLElement;
    isDragging.current = isDragHandle;

    if (isDragHandle) {
      setDraggedIndex({ itemId });
    }
  };

  const handleDragHandleTouchStart = (e: React.TouchEvent, itemId: string) => {
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartItemId.current = itemId;
    touchStartElement.current = e.currentTarget.closest('[data-item-id]') as HTMLElement;
    isDragging.current = true;
    setDraggedIndex({ itemId });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || !touchStartX.current || !touchStartItemId.current) {
      return;
    }

    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    const deltaX = Math.abs(touch.clientX - touchStartX.current);

    // Если еще не начали drag, проверяем порог
    if (!isDragging.current) {
      // Если движение в основном вертикальное (скролл), не начинаем drag
      if (deltaY > deltaX * 2 && deltaY > DRAG_THRESHOLD) {
        // Это скролл, не drag - очищаем состояние и разрешаем скролл
        touchStartY.current = null;
        touchStartX.current = null;
        touchStartItemId.current = null;
        touchStartElement.current = null;
        return;
      }
      // Если движение в основном горизонтальное или достаточно большое, начинаем drag
      if (deltaX > DRAG_THRESHOLD || (deltaY > DRAG_THRESHOLD && deltaX > DRAG_THRESHOLD / 2)) {
        isDragging.current = true;
        if (touchStartItemId.current) {
          setDraggedIndex({ itemId: touchStartItemId.current });
        }
      } else {
        // Еще не достигли порога, разрешаем скролл
        return;
      }
    }

    // Если drag начался, предотвращаем скролл
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      const listElement = e.currentTarget;
      const listItems = listElement.querySelectorAll('[data-item-id]');

      let targetItemId: string | null = null;
      let position: 'before' | 'after' = 'after';

      listItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          targetItemId = item.getAttribute('data-item-id');
          const y = touch.clientY - rect.top;
          const height = rect.height;
          position = y < height / 2 ? 'before' : 'after';
        }
      });

      if (targetItemId && touchStartItemId.current !== targetItemId) {
        setDragOverIndex({ itemId: targetItemId, position });
      }
    }
  };

  const handleTouchEnd = () => {
    const result = {
      draggedItemId: touchStartItemId.current,
      targetItemId: dragOverIndex?.itemId || null,
      position: dragOverIndex?.position || null,
      wasDragging: isDragging.current,
    };

    touchStartY.current = null;
    touchStartX.current = null;
    touchStartItemId.current = null;
    touchStartElement.current = null;
    isDragging.current = false;
    setDraggedIndex(null);
    setDragOverIndex(null);

    return result;
  };

  const handleTouchCancel = () => {
    touchStartY.current = null;
    touchStartX.current = null;
    touchStartItemId.current = null;
    touchStartElement.current = null;
    isDragging.current = false;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    handleTouchStart,
    handleDragHandleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
};
