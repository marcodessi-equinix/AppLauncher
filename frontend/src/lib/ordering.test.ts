import { describe, it, expect } from 'vitest';
import {
  normalizeOrder,
  reorderItems,
  moveItemToPosition,
  toReorderPayload,
} from './ordering';

// Helper to make test items
const items = (ids: number[]) =>
  ids.map((id, i) => ({ id, order: i, title: `G${id}` }));

// Helper to extract id sequence
const ids = (arr: Array<{ id: number }>) => arr.map((x) => x.id);

// Helper to extract order sequence
const orders = (arr: Array<{ order: number }>) => arr.map((x) => x.order);

describe('normalizeOrder', () => {
  it('assigns contiguous 0-based orders', () => {
    const input = [
      { id: 10, order: 5 },
      { id: 20, order: 99 },
      { id: 30, order: -1 },
    ];
    const result = normalizeOrder(input);
    expect(orders(result)).toEqual([0, 1, 2]);
    expect(ids(result)).toEqual([10, 20, 30]); // preserves array order
  });

  it('handles empty array', () => {
    expect(normalizeOrder([])).toEqual([]);
  });

  it('handles single item', () => {
    const result = normalizeOrder([{ id: 1, order: 42 }]);
    expect(result).toEqual([{ id: 1, order: 0 }]);
  });

  it('does not mutate input', () => {
    const input = [{ id: 1, order: 5 }];
    const result = normalizeOrder(input);
    expect(input[0].order).toBe(5);
    expect(result[0].order).toBe(0);
    expect(result[0]).not.toBe(input[0]);
  });
});

describe('reorderItems', () => {
  it('moves first to last', () => {
    const result = reorderItems(items([1, 2, 3, 4]), 0, 3);
    expect(ids(result)).toEqual([2, 3, 4, 1]);
    expect(orders(result)).toEqual([0, 1, 2, 3]);
  });

  it('moves last to first', () => {
    const result = reorderItems(items([1, 2, 3, 4]), 3, 0);
    expect(ids(result)).toEqual([4, 1, 2, 3]);
    expect(orders(result)).toEqual([0, 1, 2, 3]);
  });

  it('moves middle to middle (2nd to 3rd)', () => {
    const result = reorderItems(items([1, 2, 3, 4]), 1, 2);
    expect(ids(result)).toEqual([1, 3, 2, 4]);
    expect(orders(result)).toEqual([0, 1, 2, 3]);
  });

  it('same index returns normalized copy', () => {
    const input = items([1, 2, 3]);
    const result = reorderItems(input, 1, 1);
    expect(ids(result)).toEqual([1, 2, 3]);
    expect(orders(result)).toEqual([0, 1, 2]);
    expect(result).not.toBe(input);
  });

  it('clamps toIndex above array length', () => {
    const result = reorderItems(items([1, 2, 3]), 0, 100);
    expect(ids(result)).toEqual([2, 3, 1]);
    expect(orders(result)).toEqual([0, 1, 2]);
  });

  it('clamps toIndex below zero', () => {
    const result = reorderItems(items([1, 2, 3]), 2, -5);
    expect(ids(result)).toEqual([3, 1, 2]);
    expect(orders(result)).toEqual([0, 1, 2]);
  });

  it('works with two items', () => {
    const result = reorderItems(items([1, 2]), 0, 1);
    expect(ids(result)).toEqual([2, 1]);
    expect(orders(result)).toEqual([0, 1]);
  });

  it('works with single item', () => {
    const result = reorderItems(items([1]), 0, 0);
    expect(ids(result)).toEqual([1]);
    expect(orders(result)).toEqual([0]);
  });
});

describe('moveItemToPosition', () => {
  it('moves item by id to target position', () => {
    const result = moveItemToPosition(items([10, 20, 30, 40]), 30, 0);
    expect(ids(result)).toEqual([30, 10, 20, 40]);
    expect(orders(result)).toEqual([0, 1, 2, 3]);
  });

  it('moves item to last position', () => {
    const result = moveItemToPosition(items([10, 20, 30, 40]), 10, 3);
    expect(ids(result)).toEqual([20, 30, 40, 10]);
    expect(orders(result)).toEqual([0, 1, 2, 3]);
  });

  it('returns normalized if id not found', () => {
    const input = [
      { id: 1, order: 5 },
      { id: 2, order: 99 },
    ];
    const result = moveItemToPosition(input, 999, 0);
    expect(ids(result)).toEqual([1, 2]);
    expect(orders(result)).toEqual([0, 1]);
  });

  it('clamps target position', () => {
    const result = moveItemToPosition(items([1, 2, 3]), 1, 100);
    expect(ids(result)).toEqual([2, 3, 1]);
  });

  it('same position returns normalized copy', () => {
    const result = moveItemToPosition(items([1, 2, 3]), 2, 1);
    expect(ids(result)).toEqual([1, 2, 3]);
  });
});

describe('toReorderPayload', () => {
  it('creates {id, order} pairs with 0-based index', () => {
    const input = [
      { id: 10, order: 99 },
      { id: 20, order: 55 },
      { id: 30, order: 1 },
    ];
    expect(toReorderPayload(input)).toEqual([
      { id: 10, order: 0 },
      { id: 20, order: 1 },
      { id: 30, order: 2 },
    ]);
  });

  it('handles empty array', () => {
    expect(toReorderPayload([])).toEqual([]);
  });
});

describe('ordering invariants', () => {
  it('orders are always contiguous after any operation', () => {
    const base = items([1, 2, 3, 4, 5]);
    // Do several operations in sequence
    let result = reorderItems(base, 0, 4);
    expect(orders(result)).toEqual([0, 1, 2, 3, 4]);

    result = reorderItems(result, 3, 1);
    expect(orders(result)).toEqual([0, 1, 2, 3, 4]);

    result = moveItemToPosition(result, result[2].id, 0);
    expect(orders(result)).toEqual([0, 1, 2, 3, 4]);
  });

  it('no duplicate order values after multiple moves', () => {
    let data = items([1, 2, 3, 4, 5, 6, 7, 8]);
    for (let i = 0; i < 20; i++) {
      const from = Math.floor(Math.random() * data.length);
      const to = Math.floor(Math.random() * data.length);
      data = reorderItems(data, from, to);
      const orderSet = new Set(orders(data));
      expect(orderSet.size).toBe(data.length);
      expect(Math.max(...orders(data))).toBe(data.length - 1);
      expect(Math.min(...orders(data))).toBe(0);
    }
  });

  it('item count is preserved through all operations', () => {
    const base = items([1, 2, 3, 4, 5]);
    const r1 = reorderItems(base, 0, 4);
    expect(r1.length).toBe(5);
    const r2 = moveItemToPosition(r1, 3, 0);
    expect(r2.length).toBe(5);
    const r3 = normalizeOrder(r2);
    expect(r3.length).toBe(5);
  });

  it('id set is preserved through reorder', () => {
    const base = items([10, 20, 30, 40, 50]);
    const result = reorderItems(base, 0, 4);
    expect(new Set(ids(result))).toEqual(new Set([10, 20, 30, 40, 50]));
  });
});
