import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = process.env.DATASET_DEMO_TOKEN || 'controlplane-demo-token-2026';
  if (process.env.DEMO_MODE === 'true' && token && request.nextUrl.pathname.startsWith('/evaluation/datasets')) {
    response.cookies.set('controlplane_dataset_demo', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/'
    });
  }
  return response;
}

export const config = { matcher: ['/evaluation/datasets/:path*', '/api/evaluation/datasets/:path*'] };
