// ============================================================
// ControlPlane.ai — Demo Reset Route Handler
// POST /api/demo/reset
// ============================================================

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const expectedToken = process.env.DEMO_RESET_TOKEN || 'controlplane-demo';
    if (process.env.DEMO_MODE !== 'true' || req.headers.get('x-demo-token') !== expectedToken) {
      return NextResponse.json({ error: 'Demo reset is disabled outside authorized demo mode' }, { status: 403 });
    }
    const db = getDatabase();

    // Reset runtime transactions in SQLite
    db.prepare('DELETE FROM control_desk').run();
    db.prepare('DELETE FROM decisions').run();

    return NextResponse.json({
      success: true,
      message: 'ControlPlane demo environment reset to clean state.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting demo database:', error);
    return NextResponse.json(
      { error: 'Failed to reset demo database' },
      { status: 500 }
    );
  }
}
