// ============================================================
// ControlPlane.ai — CLI Demo Reset Script (.mjs)
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'controlplane.db');

console.log(`🔄 Resetting ControlPlane demo database at: ${dbPath}`);

try {
  const db = new Database(dbPath);

  // Initialize schema if not present
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id                    TEXT PRIMARY KEY,
      request_id            TEXT NOT NULL UNIQUE,
      timestamp             TEXT NOT NULL,
      model                 TEXT NOT NULL,
      task_type             TEXT NOT NULL,
      business_impact       TEXT NOT NULL,
      ai_response           TEXT NOT NULL,
      edited_response       TEXT,
      decision              TEXT NOT NULL,
      decision_reason       TEXT NOT NULL,
      confidence            REAL NOT NULL,
      performance_score     REAL NOT NULL DEFAULT 0,
      cost_score            REAL NOT NULL DEFAULT 0,
      responsibility_score  REAL NOT NULL DEFAULT 0,
      composite_score       REAL NOT NULL DEFAULT 0,
      verification_tier     INTEGER NOT NULL DEFAULT 0,
      latency_ms            REAL NOT NULL DEFAULT 0,
      detections_json       TEXT NOT NULL DEFAULT '[]',
      evidence_json         TEXT NOT NULL DEFAULT '[]',
      verification_path_json TEXT NOT NULL DEFAULT '[]',
      audit_event_json      TEXT NOT NULL DEFAULT '{}',
      demo_mode             INTEGER NOT NULL DEFAULT 0,
      scenario              TEXT
    );

    CREATE TABLE IF NOT EXISTS control_desk (
      id                TEXT PRIMARY KEY,
      request_id        TEXT NOT NULL UNIQUE,
      timestamp         TEXT NOT NULL,
      task_type         TEXT NOT NULL,
      business_impact   TEXT NOT NULL,
      model             TEXT NOT NULL,
      ai_response       TEXT NOT NULL,
      edited_response   TEXT,
      decision_reason   TEXT NOT NULL,
      performance_score REAL NOT NULL DEFAULT 0,
      cost_score        REAL NOT NULL DEFAULT 0,
      responsibility_score REAL NOT NULL DEFAULT 0,
      composite_score   REAL NOT NULL DEFAULT 0,
      detections_json   TEXT NOT NULL DEFAULT '[]',
      evidence_json     TEXT NOT NULL DEFAULT '[]',
      status            TEXT NOT NULL DEFAULT 'PENDING',
      resolved_at       TEXT,
      reviewer_id       TEXT,
      reviewer_action   TEXT,
      reviewer_note     TEXT,
      scenario          TEXT
    );
  `);

  db.prepare('DELETE FROM control_desk').run();
  db.prepare('DELETE FROM decisions').run();

  console.log('✅ Demo database reset complete. Ready for clean presentation.');
  process.exit(0);
} catch (err) {
  console.error('❌ Failed to reset demo database:', err);
  process.exit(1);
}
