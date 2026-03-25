import { sessionCheckDuration, sessionCheckTotal } from '../metrics/auth-metrics';

export type SessionStatus = 'valid' | 'revoked' | 'expired' | 'invalid' | 'error';

export type SessionCheckResult = {
  status: SessionStatus;
  durationMs: number;
};

export async function checkSession({
  token,
  coreAuthUrl,
  timeoutMs = 5000,
}: {
  token: string;
  coreAuthUrl: string;
  timeoutMs?: number;
}): Promise<SessionCheckResult> {
  const start = performance.now();

  try {
    const res = await fetch(`${coreAuthUrl}/auth/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const data = (await res.json()) as { status: SessionStatus };
    const durationMs = performance.now() - start;

    sessionCheckDuration.record(durationMs, { status: data.status });
    sessionCheckTotal.add(1, { status: data.status });

    return { status: data.status, durationMs };
  } catch {
    const durationMs = performance.now() - start;

    sessionCheckDuration.record(durationMs, { status: 'error' });
    sessionCheckTotal.add(1, { status: 'error' });

    return { status: 'error', durationMs };
  }
}
