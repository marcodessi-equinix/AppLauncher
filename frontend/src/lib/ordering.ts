/**
 * Central ordering logic for groups and links.
 * All reorder operations MUST go through these functions to ensure
 * deterministic, normalized, gap-free order values.
 */

interface Orderable {
  id: number;
  order: number;
}

/**
 * Normalize order values to a contiguous 0-based sequence.
 * Returns new array — does NOT mutate input.
 */
export function normalizeOrder<T extends Orderable>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index }));
}

/**
 * Reorder items by moving the item at `fromIndex` to `toIndex`.
 * Returns a fully normalized copy.
 */
export function reorderItems<T extends Orderable>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return normalizeOrder(items);
  const clamped = Math.max(0, Math.min(toIndex, items.length - 1));
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(clamped, 0, moved);
  return normalizeOrder(result);
}

/**
 * Move a specific item (by id) to a 0-based target position.
 * Returns a fully normalized copy.
 */
export function moveItemToPosition<T extends Orderable>(items: T[], itemId: number, targetPosition: number): T[] {
  const fromIndex = items.findIndex((item) => item.id === itemId);
  if (fromIndex === -1) return normalizeOrder(items);
  return reorderItems(items, fromIndex, targetPosition);
}

/**
 * Build the payload array for the reorder API endpoint.
 */
export function toReorderPayload(items: Orderable[]): Array<{ id: number; order: number }> {
  return items.map((item, index) => ({ id: item.id, order: index }));
}
