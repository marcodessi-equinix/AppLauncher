import type { Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/index';

const LinkRequestStatusSchema = z.enum(['open', 'implemented']);

const CreateLinkRequestSchema = z.object({
  clientId: z.string().uuid(),
  message: z.string().trim().min(5).max(4000),
  requesterLabel: z.string().trim().max(120).optional().or(z.literal('')),
});

const UpdateLinkRequestParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const UpdateLinkRequestSchema = z.object({
  status: LinkRequestStatusSchema.optional(),
}).refine((value) => value.status !== undefined, {
  message: 'No changes provided',
});

type LinkRequestRow = {
  id: number;
  client_id: string;
  message: string;
  status: 'open' | 'implemented';
  admin_note: string | null;
  requester_label: string | null;
  created_at: string;
  updated_at: string;
  client_created_at: string | null;
  client_last_seen: string | null;
};

const normalizeTimestamp = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}Z`;
  }

  return trimmed;
};

const listQuery = `
  SELECT
    lr.id,
    lr.client_id,
    lr.message,
    lr.status,
    lr.admin_note,
    lr.requester_label,
    lr.created_at,
    lr.updated_at,
    c.created_at AS client_created_at,
    c.last_seen AS client_last_seen
  FROM link_requests lr
  LEFT JOIN clients c ON c.id = lr.client_id
  ORDER BY
    CASE lr.status
      WHEN 'open' THEN 0
      ELSE 1
    END,
    lr.created_at DESC,
    lr.id DESC
`;

const singleRequestQuery = `
  SELECT
    lr.id,
    lr.client_id,
    lr.message,
    lr.status,
    lr.admin_note,
    lr.requester_label,
    lr.created_at,
    lr.updated_at,
    c.created_at AS client_created_at,
    c.last_seen AS client_last_seen
  FROM link_requests lr
  LEFT JOIN clients c ON c.id = lr.client_id
  WHERE lr.id = ?
`;

const mapLinkRequest = (row: LinkRequestRow) => ({
  id: row.id,
  clientId: row.client_id,
  message: row.message,
  status: row.status,
  adminNote: row.admin_note,
  requesterLabel: row.requester_label,
  createdAt: normalizeTimestamp(row.created_at),
  updatedAt: normalizeTimestamp(row.updated_at),
  client: {
    id: row.client_id,
    createdAt: normalizeTimestamp(row.client_created_at),
    lastSeen: normalizeTimestamp(row.client_last_seen),
  },
});

export const createLinkRequest = (req: Request, res: Response) => {
  const result = CreateLinkRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid link request payload' });
  }

  const { clientId, message, requesterLabel } = result.data;

  try {
    const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get<{ id: string }>(clientId);
    if (!existingClient) {
      return res.status(400).json({ error: 'Unknown client id' });
    }

    db.prepare('UPDATE clients SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(clientId);

    const insert = db.prepare(`
      INSERT INTO link_requests (client_id, message, requester_label)
      VALUES (?, ?, ?)
    `);
    const resultInsert = insert.run(clientId, message, requesterLabel || null);

    const requestRow = db.prepare(singleRequestQuery).get<LinkRequestRow>(resultInsert.lastInsertRowid);

    if (!requestRow) {
      return res.status(201).json({ success: true });
    }

    res.status(201).json({ request: mapLinkRequest(requestRow) });
  } catch (error) {
    console.error('Error creating link request:', error);
    res.status(500).json({ error: 'Failed to create link request' });
  }
};

export const listLinkRequests = (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(listQuery).all<LinkRequestRow>();
    res.json({ requests: rows.map(mapLinkRequest) });
  } catch (error) {
    console.error('Error loading link requests:', error);
    res.status(500).json({ error: 'Failed to load link requests' });
  }
};

export const updateLinkRequest = (req: Request, res: Response) => {
  const paramsResult = UpdateLinkRequestParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: 'Invalid link request id' });
  }

  const bodyResult = UpdateLinkRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ error: 'Invalid link request update payload' });
  }

  const { id } = paramsResult.data;
  const { status } = bodyResult.data;
  const nextStatus = status ?? 'open';

  try {
    const existing = db.prepare('SELECT id FROM link_requests WHERE id = ?').get<{ id: number }>(id);
    if (!existing) {
      return res.status(404).json({ error: 'Link request not found' });
    }

    db.prepare(`
      UPDATE link_requests
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStatus, id);

    const row = db.prepare(singleRequestQuery).get<LinkRequestRow>(id);
    res.json({ request: row ? mapLinkRequest(row) : null });
  } catch (error) {
    console.error('Error updating link request:', error);
    res.status(500).json({ error: 'Failed to update link request' });
  }
};