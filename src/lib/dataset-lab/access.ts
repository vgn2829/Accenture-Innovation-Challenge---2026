import { NextRequest } from 'next/server';

/** Local/demo boundary. Browser access uses an HTTP-only cookie; scripts use the server token header. */
export function datasetDemoError(request: NextRequest): string | null {
  if (process.env.DEMO_MODE !== 'true') return 'Dataset Lab is unavailable because demo mode is not configured on this server.';
  const configuredToken = process.env.DATASET_DEMO_TOKEN;
  if (!configuredToken) return 'Dataset Lab is unavailable: DATASET_DEMO_TOKEN is not set in the server environment.';
  const providedToken = request.headers.get('x-dataset-demo-token') || request.cookies.get('controlplane_dataset_demo')?.value;
  if (providedToken !== configuredToken) return 'Dataset Lab session not established. Navigate to /evaluation/datasets to begin a session.';
  return null;
}
