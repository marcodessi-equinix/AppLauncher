import express from 'express';
import db from '../db/index';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { isAllowedIconValue, normalizeStoredIconValue } from '../lib/iconPolicy';
import { requireTrustedOrigin } from '../middleware/trustedOrigin';

const router = express.Router();

const GroupSchema = z.object({
  title: z.string().trim().min(1).max(80),
  order: z.coerce.number().int().min(-1).max(10000).optional().default(-1),
  icon: z.preprocess(
    (value) => typeof value === 'string' ? value.trim() : value,
    z.string().max(160).optional()
  ).refine((value) => value === undefined || isAllowedIconValue(value), { message: 'Invalid icon value' }),
});

// GET all groups
router.get('/', (req, res) => {
  const groups = db.prepare('SELECT * FROM groups ORDER BY "order" ASC').all();
  res.json(groups);
});

// POST create group (Admin only)
router.post('/', requireTrustedOrigin, requireAdmin, (req, res) => {
  const result = GroupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const { title, order, icon } = result.data;
  const normalizedIcon = normalizeStoredIconValue(icon);
  
  try {
    // Insert the group first, then position it correctly and normalize all orders
    const maxRow = db.prepare('SELECT COALESCE(MAX("order"), -1) AS maxOrder FROM groups').get() as { maxOrder: number };
    const tempOrder = maxRow.maxOrder + 1;

    const insertStmt = db.prepare('INSERT INTO groups (title, "order", icon) VALUES (?, ?, ?)');
    const info = insertStmt.run(title, tempOrder, normalizedIcon || null);
    const newId = Number(info.lastInsertRowid);

    // Now reposition: get all groups in order, move the new one to the requested position
    // order=-1 (default) means "append at end"
    const allGroups = db.prepare('SELECT id FROM groups ORDER BY "order" ASC').all() as { id: number }[];
    const targetIndex = order < 0
      ? allGroups.length - 1
      : Math.max(0, Math.min(order, allGroups.length - 1));
    const reordered = allGroups.filter((g) => g.id !== newId);
    reordered.splice(targetIndex, 0, { id: newId });

    const orderStmt = db.prepare('UPDATE groups SET "order" = ? WHERE id = ?');
    db.transaction(() => {
      reordered.forEach((g, index) => orderStmt.run(index, g.id));
    })();

    const finalOrder = reordered.findIndex((g) => g.id === newId);
    
    // Log audit
    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'CREATE_GROUP', 
      JSON.stringify({ id: newId, title })
    );

    res.json({ id: newId, title, order: finalOrder, icon: normalizedIcon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// PUT update group
router.put('/:id', requireTrustedOrigin, requireAdmin, (req, res) => {
  const idResult = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!idResult.success) {
    return res.status(400).json({ error: 'Invalid group id' });
  }

  const id = idResult.data;
  const result = GroupSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const { title, order, icon } = result.data;
  const normalizedIcon = normalizeStoredIconValue(icon);

  try {
    // Move group to the requested position and normalize all orders
    const allGroups = db.prepare('SELECT id FROM groups ORDER BY "order" ASC').all() as { id: number }[];
    const currentIndex = allGroups.findIndex((g) => g.id === id);
    if (currentIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Remove from current position, insert at target
    // order < 0 means "keep current position"
    const targetIndex = order < 0 ? currentIndex : Math.max(0, Math.min(order, allGroups.length - 1));
    const reordered = allGroups.filter((g) => g.id !== id);
    reordered.splice(targetIndex, 0, { id });

    const updateStmt = db.prepare('UPDATE groups SET title = ?, icon = ? WHERE id = ?');
    const orderStmt = db.prepare('UPDATE groups SET "order" = ? WHERE id = ?');

    db.transaction(() => {
      updateStmt.run(title, normalizedIcon || null, id);
      reordered.forEach((g, index) => orderStmt.run(index, g.id));
    })();

    const finalOrder = reordered.findIndex((g) => g.id === id);

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'UPDATE_GROUP', 
      JSON.stringify({ id, title })
    );

    res.json({ id: Number(id), title, order: finalOrder, icon: normalizedIcon });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// DELETE group
router.delete('/:id', requireTrustedOrigin, requireAdmin, (req, res) => {
  const idResult = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!idResult.success) {
    return res.status(400).json({ error: 'Invalid group id' });
  }

  const id = idResult.data;

  try {
    const stmt = db.prepare('DELETE FROM groups WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Normalize remaining group orders to eliminate gaps
    const remaining = db.prepare('SELECT id FROM groups ORDER BY "order" ASC').all() as { id: number }[];
    const normalizeStmt = db.prepare('UPDATE groups SET "order" = ? WHERE id = ?');
    db.transaction(() => {
      remaining.forEach((row, index) => normalizeStmt.run(index, row.id));
    })();

    db.prepare('INSERT INTO audit_logs (action, details) VALUES (?, ?)').run(
      'DELETE_GROUP', 
      JSON.stringify({ id })
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;
