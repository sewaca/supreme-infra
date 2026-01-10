export type SortableItem = {
  id: string;
  priority: number;
  [key: string]: unknown;
};

export type DragState = {
  itemId: string;
} | null;

export type DragOverState = {
  itemId: string;
  position: 'before' | 'after';
} | null;

export type EditingPriorityState = {
  itemId: string;
  value: string;
} | null;
