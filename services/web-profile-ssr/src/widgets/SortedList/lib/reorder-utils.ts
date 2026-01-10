import type { SortableItem } from '../types';

export const reorderItems = <T extends SortableItem>(
  items: T[],
  fromIndex: number,
  toIndex: number,
  position: 'before' | 'after' = 'after',
): T[] => {
  const newItems = [...items];
  const draggedItem = { ...newItems[fromIndex] };

  // Удаляем элемент из старой позиции
  newItems.splice(fromIndex, 1);

  // Определяем позицию вставки
  let newIndex: number;
  if (position === 'after') {
    // Если вставляем после элемента
    if (fromIndex < toIndex) {
      // Перетаскиваем вниз: после удаления целевой элемент сдвинулся на 1 влево
      newIndex = toIndex;
    } else {
      // Перетаскиваем вверх: целевой элемент остался на месте
      newIndex = toIndex + 1;
    }
  } else {
    // Если вставляем перед элементом
    if (fromIndex < toIndex) {
      // Перетаскиваем вниз: после удаления целевой элемент сдвинулся на 1 влево
      newIndex = toIndex - 1;
    } else {
      // Перетаскиваем вверх: целевой элемент остался на месте
      newIndex = toIndex;
    }
  }

  // Вставляем элемент в новую позицию
  newItems.splice(newIndex, 0, draggedItem);

  // Пересчитываем приоритеты как порядковые номера (1, 2, 3, 4...)
  newItems.forEach((item, index) => {
    item.priority = index + 1;
  });

  return newItems;
};

export const updatePriorityAndSort = <T extends SortableItem>(
  items: T[],
  itemIndex: number,
  newPriority: number,
): T[] => {
  const newItems = [...items];

  // Обновляем значение приоритета для выбранного элемента
  newItems[itemIndex] = { ...newItems[itemIndex], priority: newPriority };

  // Сортируем по приоритету (по возрастанию - большие значения в конце)
  newItems.sort((a, b) => a.priority - b.priority);

  // Пересчитываем приоритеты как порядковые номера (1, 2, 3, 4...)
  newItems.forEach((item, index) => {
    item.priority = index + 1;
  });

  return newItems;
};
