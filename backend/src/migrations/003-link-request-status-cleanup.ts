import type { AppDatabase } from '../db/index';

export async function up(db: AppDatabase) {
  db.exec(`
    UPDATE link_requests
    SET status = 'implemented', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'reviewed';
  `);
}