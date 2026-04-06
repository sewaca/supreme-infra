export async function GET(): Promise<Response> {
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

  return new Response('ok after 5000ms timeout', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
