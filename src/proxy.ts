import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = process.env.DATASET_DEMO_TOKEN;
  if (process.env.DEMO_MODE === 'true' && token && request.nextUrl.pathname === '/evaluation/datasets') {
    response.cookies.set('controlplane_dataset_demo', token, { httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/api/evaluation/datasets' });
  }
  return response;
}

export const config = { matcher: ['/evaluation/datasets'] };
