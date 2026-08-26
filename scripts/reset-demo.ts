// ============================================================
// ControlPlane.ai — CLI Demo Reset Script
// ============================================================

import { getDatabase } from '../src/lib/db/client';

console.log('🔄 Resetting ControlPlane demo database...');

try {
  const db = getDatabase();
  db.prepare('DELETE FROM control_desk_cases').run();
  db.prepare('DELETE FROM audit_events').run();
  db.prepare('DELETE FROM decisions').run();
  console.log('✅ Demo database reset complete. Fresh state ready for presentation.');
  process.exit(0);
} catch (err) {
  console.error('❌ Failed to reset demo database:', err);
  process.exit(1);
}
