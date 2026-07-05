import { IS_TESTER_MODE } from './constants';

/**
 * n8n workflow triggers. In tester mode we do NOT hit real webhooks —
 * the API layer simulates the workflow result instantly with mock data.
 * In production, set N8N_WEBHOOK_BASE + N8N_API_KEY in Vercel env.
 */
const WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE || '';

export type N8nWorkflow =
  | 'feasibility-generator'
  | 'floor-plan-generator'
  | 'communication-logger'
  | 'task-accountability'
  | 'projections-generator';

export async function triggerWorkflow(
  workflow: N8nWorkflow,
  payload: Record<string, unknown>,
): Promise<{ triggered: boolean; simulated: boolean }> {
  if (IS_TESTER_MODE || !WEBHOOK_BASE) {
    // Tester mode: caller simulates the output. No network call, $0.
    return { triggered: true, simulated: true };
  }
  const res = await fetch(`${WEBHOOK_BASE}/webhook/${workflow}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_API_KEY ? { 'X-N8N-API-KEY': process.env.N8N_API_KEY } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`n8n workflow ${workflow} failed: ${res.status}`);
  return { triggered: true, simulated: false };
}
