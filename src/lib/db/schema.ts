// ============================================================
// ControlPlane.ai — SQLite Schema & Initialization
// ============================================================

export const CREATE_TABLES_SQL = `
-- Main decisions table (append-only audit log)
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
  scenario              TEXT,
  profile               TEXT NOT NULL DEFAULT 'customer_support',
  region                TEXT NOT NULL DEFAULT 'GLOBAL',
  policy_version        TEXT NOT NULL DEFAULT 'profile-policy-v1.0',
  evidence_source       TEXT NOT NULL DEFAULT 'none',
  latency_budget_ms     INTEGER NOT NULL DEFAULT 100
);

-- Control desk queue (escalated cases)
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
  scenario          TEXT,
  profile           TEXT NOT NULL DEFAULT 'customer_support',
  region            TEXT NOT NULL DEFAULT 'GLOBAL',
  policy_version    TEXT NOT NULL DEFAULT 'profile-policy-v1.0',
  evidence_source   TEXT NOT NULL DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS feedback_events (
  id                TEXT PRIMARY KEY,
  request_id        TEXT NOT NULL,
  original_decision TEXT NOT NULL,
  reviewer_action   TEXT NOT NULL,
  final_decision    TEXT NOT NULL,
  corrected_label   TEXT,
  reason            TEXT,
  timestamp         TEXT NOT NULL,
  profile           TEXT NOT NULL,
  policy_version    TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_decision ON decisions (decision);
CREATE INDEX IF NOT EXISTS idx_decisions_demo_mode ON decisions (demo_mode);
CREATE INDEX IF NOT EXISTS idx_control_desk_status ON control_desk (status);
CREATE INDEX IF NOT EXISTS idx_control_desk_timestamp ON control_desk (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_request ON feedback_events (request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback_events (timestamp DESC);
`;
