import { describe, it, expect } from 'vitest';
import {
  upsertGroupInDashboard,
  removeGroupFromDashboard,
  upsertLinkInDashboard,
  removeLinkFromDashboard,
} from './dashboardData';
import type { Group, Link } from '../types';

const makeGroup = (id: number, order: number, links: Link[] = []): Group => ({
  id,
  title: `Group ${id}`,
  order,
  links,
});

const makeLink = (id: number, groupId: number, order: number): Link => ({
  id,
  group_id: groupId,
  title: `Link ${id}`,
  url: `https://example.com/${id}`,
  order,
});

const ids = (groups: Group[]) => groups.map((g) => g.id);
const orders = (groups: Group[]) => groups.map((g) => g.order);

describe('upsertGroupInDashboard', () => {
  it('inserts new group and normalizes orders', () => {
    const groups = [makeGroup(1, 0), makeGroup(2, 1)];
    const newGroup = makeGroup(3, 2);
    const result = upsertGroupInDashboard(groups, newGroup);
    expect(ids(result)).toEqual([1, 2, 3]);
    expect(orders(result)).toEqual([0, 1, 2]);
  });

  it('updates existing group and re-sorts by order', () => {
    const groups = [makeGroup(1, 0), makeGroup(2, 1), makeGroup(3, 2)];
    // Move group 3 to order 0 — ties with group 1, stable sort keeps group 1 first
    const updated = { ...makeGroup(3, 0), title: 'Updated' };
    const result = upsertGroupInDashboard(groups, updated);
    // With order=0 for both group 1 and group 3, stable sort puts group 1 first
    // (group 1 appears earlier in the input array)
    expect(ids(result)).toEqual([1, 3, 2]);
    expect(orders(result)).toEqual([0, 1, 2]);
    expect(result[1].title).toBe('Updated');
  });

  it('preserves existing links on update', () => {
    const link = makeLink(10, 1, 0);
    const groups = [makeGroup(1, 0, [link])];
    const updated = { ...makeGroup(1, 0), title: 'Renamed' };
    const result = upsertGroupInDashboard(groups, updated);
    expect(result[0].links).toEqual([link]);
  });

  it('returns normalized orders with no duplicates', () => {
    const groups = [makeGroup(1, 0), makeGroup(2, 1), makeGroup(3, 2)];
    // Insert with a duplicate order value
    const result = upsertGroupInDashboard(groups, makeGroup(4, 1));
    const orderSet = new Set(orders(result));
    expect(orderSet.size).toBe(result.length);
    expect(Math.min(...orders(result))).toBe(0);
    expect(Math.max(...orders(result))).toBe(result.length - 1);
  });
});

describe('removeGroupFromDashboard', () => {
  it('removes group by id', () => {
    const groups = [makeGroup(1, 0), makeGroup(2, 1), makeGroup(3, 2)];
    const result = removeGroupFromDashboard(groups, 2);
    expect(ids(result)).toEqual([1, 3]);
  });

  it('handles non-existent id', () => {
    const groups = [makeGroup(1, 0)];
    const result = removeGroupFromDashboard(groups, 999);
    expect(ids(result)).toEqual([1]);
  });
});

describe('upsertLinkInDashboard', () => {
  it('adds link to correct group sorted by order', () => {
    const link1 = makeLink(1, 1, 0);
    const groups = [makeGroup(1, 0, [link1]), makeGroup(2, 1)];
    const newLink = makeLink(2, 1, 1);
    const result = upsertLinkInDashboard(groups, newLink);
    expect(result[0].links!.map((l) => l.id)).toEqual([1, 2]);
  });

  it('moves link between groups', () => {
    const link = makeLink(1, 1, 0);
    const groups = [makeGroup(1, 0, [link]), makeGroup(2, 1)];
    const movedLink = { ...link, group_id: 2, order: 0 };
    const result = upsertLinkInDashboard(groups, movedLink);
    expect(result[0].links).toEqual([]);
    expect(result[1].links!.map((l) => l.id)).toEqual([1]);
  });
});

describe('removeLinkFromDashboard', () => {
  it('removes link from its group', () => {
    const link1 = makeLink(1, 1, 0);
    const link2 = makeLink(2, 1, 1);
    const groups = [makeGroup(1, 0, [link1, link2])];
    const result = removeLinkFromDashboard(groups, 1);
    expect(result[0].links!.map((l) => l.id)).toEqual([2]);
  });
});
