import { NextResponse } from 'next/server';
import { getControlDeskCases } from '@/lib/db/operations';

export async function GET() {
  try {
    return NextResponse.json({ data: getControlDeskCases('PENDING') }, { status: 200 });
  } catch (error) {
    console.error('[API Error] GET /api/controldesk failure:', error);
    return NextResponse.json({ error: 'Failed to retrieve Control Desk queue' }, { status: 500 });
  }
}
