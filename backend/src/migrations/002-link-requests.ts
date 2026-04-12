import type { AppDatabase } from '../db/index';

export async function up(db: AppDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS link_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_note TEXT,
      requester_label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      CHECK (status IN ('open', 'reviewed', 'implemented'))
    );

    CREATE INDEX IF NOT EXISTS idx_link_requests_created_at ON link_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);
  `);
}