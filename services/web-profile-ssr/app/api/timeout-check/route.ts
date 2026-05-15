export async function GET(): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  return new Response('ok after 10 000 ms timeout', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
