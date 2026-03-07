import { Request, Response } from 'express';
import db from '../db/index';

export const getFavorites = (req: Request, res: Response) => {
  const { clientId } = req.params;

  try {
    const stmt = db.prepare('SELECT link_id FROM favorites WHERE client_id = ?');
    const rows = stmt.all(clientId) as { link_id: number }[];
    const favoriteIds = rows.map(row => row.link_id);
    res.json(favoriteIds);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

export const addFavorite = (req: Request, res: Response) => {
  const { clientId, linkId } = req.body;

  if (!clientId || !linkId) {
    return res.status(400).json({ error: 'Missing clientId or linkId' });
  }

  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO favorites (client_id, link_id) VALUES (?, ?)');
    stmt.run(clientId, linkId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

export const removeFavorite = (req: Request, res: Response) => {
  const { clientId, linkId } = req.params;

  if (!clientId || !linkId) {
    return res.status(400).json({ error: 'Missing clientId or linkId' });
  }

  try {
    const stmt = db.prepare('DELETE FROM favorites WHERE client_id = ? AND link_id = ?');
    stmt.run(clientId, linkId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};
