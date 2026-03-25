/**
 * fetch-обёртка для сервер-сайд вызовов web-profile-ssr.
 * Логирует каждый исходящий запрос и его результат, включая elapsed time.
 * console.log попадает в Loki через OpenTelemetry console-patching.
 */
export const loggingFetch: typeof globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

  const method = (
    (init?.method ?? (input instanceof Request ? input.method : undefined) ?? 'GET') as string
  ).toUpperCase();
  const start = Date.now();

  console.log(`→ ${method} ${url}`);

  try {
    const res = await globalThis.fetch(input, init);
    const elapsed = Date.now() - start;
    console.log(`← ${res.status} ${method} ${url} (${elapsed}ms)`);
    return res;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`← ERR ${method} ${url} (${elapsed}ms): ${(err as Error).message}`);
    throw err;
  }
};
