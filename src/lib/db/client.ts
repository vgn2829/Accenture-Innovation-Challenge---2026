// ============================================================
// ControlPlane.ai — SQLite Database Client (Singleton)
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES_SQL } from './schema';

let db: Database.Database | null = null;

function getDbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'controlplane.db');
}

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Performance settings
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Run migrations (idempotent)
  db.exec(CREATE_TABLES_SQL);
  // Lightweight additive migrations keep existing local demo databases usable.
  const decisionColumns = db.prepare('PRAGMA table_info(decisions)').all() as Array<{ name: string }>;
  const decisionNames = new Set(decisionColumns.map(column => column.name));
  for (const [name, definition] of [
    ['profile', "TEXT NOT NULL DEFAULT 'customer_support'"],
    ['region', "TEXT NOT NULL DEFAULT 'GLOBAL'"],
    ['policy_version', "TEXT NOT NULL DEFAULT 'profile-policy-v1.0'"],
    ['evidence_source', "TEXT NOT NULL DEFAULT 'none'"],
    ['latency_budget_ms', 'INTEGER NOT NULL DEFAULT 100'],
  ] as const) {
    if (!decisionNames.has(name)) db.exec(`ALTER TABLE decisions ADD COLUMN ${name} ${definition}`);
  }
  const deskColumns = db.prepare('PRAGMA table_info(control_desk)').all() as Array<{ name: string }>;
  const deskNames = new Set(deskColumns.map(column => column.name));
  for (const [name, definition] of [
    ['profile', "TEXT NOT NULL DEFAULT 'customer_support'"],
    ['region', "TEXT NOT NULL DEFAULT 'GLOBAL'"],
    ['policy_version', "TEXT NOT NULL DEFAULT 'profile-policy-v1.0'"],
    ['evidence_source', "TEXT NOT NULL DEFAULT 'none'"],
  ] as const) {
    if (!deskNames.has(name)) db.exec(`ALTER TABLE control_desk ADD COLUMN ${name} ${definition}`);
  }

  return db;
}

export const getDatabase = getDb;

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
