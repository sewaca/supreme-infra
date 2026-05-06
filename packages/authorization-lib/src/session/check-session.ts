import { createClient, createConfig } from '@supreme-int/api-client/src/generated/core-auth/client';
import { validateSessionAuthValidateSessionPost } from '@supreme-int/api-client/src/generated/core-auth/sdk.gen';
import { sessionCheckDuration, sessionCheckTotal } from '../metrics/auth-metrics';

export type SessionStatus = 'valid' | 'revoked' | 'expired' | 'invalid' | 'error';

export type SessionCheckResult = {
  status: SessionStatus;
  durationMs: number;
};

export async function checkSession({
  token,
  coreAuthUrl,
  timeoutMs = 600,
}: {
  token: string;
  coreAuthUrl: string;
  timeoutMs?: number;
}): Promise<SessionCheckResult> {
  const start = performance.now();

  try {
    const coreAuthClient = createClient(
      createConfig({
        baseUrl: coreAuthUrl,
        fetch: (input, init) => globalThis.fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
      }),
    );

    const result = await validateSessionAuthValidateSessionPost({
      client: coreAuthClient,
      body: { token },
    });

    const durationMs = performance.now() - start;
    const status = (result.data?.status ?? 'error') as SessionStatus;

    sessionCheckDuration.record(durationMs, { status });
    sessionCheckTotal.add(1, { status });

    return { status, durationMs };
  } catch {
    const durationMs = performance.now() - start;

    sessionCheckDuration.record(durationMs, { status: 'error' });
    sessionCheckTotal.add(1, { status: 'error' });

    return { status: 'error', durationMs };
  }
}
