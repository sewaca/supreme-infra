import type { NextFetchEvent, NextProxy, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const chain = (middlewares: NextProxy[]): NextProxy => {
  return async function middleware(request: NextRequest, event: NextFetchEvent) {
    for (const mw of middlewares) {
      const response = await mw(request, event);

      if (response && response.status !== 200) {
        return response;
      }

      if (response && response.headers.get('x-middleware-next') !== '1') {
        return response;
      }
    }

    return NextResponse.next();
  };
}
