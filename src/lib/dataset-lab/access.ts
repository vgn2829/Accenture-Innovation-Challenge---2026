import { NextRequest } from 'next/server';

/** Local/demo boundary. Browser access uses an HTTP-only cookie; scripts use the server token header. */
export function datasetDemoError(request: NextRequest): string | null {
  if (process.env.DEMO_MODE !== 'true') return 'Dataset Lab is disabled outside authorized demo mode.';
  const configuredToken = process.env.DATASET_DEMO_TOKEN;
  if (!configuredToken) return 'Dataset Lab demo token is not configured.';
  const providedToken = request.headers.get('x-dataset-demo-token') || request.cookies.get('controlplane_dataset_demo')?.value;
  if (providedToken !== configuredToken) return 'A valid Dataset Lab demo token is required.';
  return null;
}
