export class BaseApi {
  protected readonly baseUrl: string;
  private readonly _fetch: typeof fetch;

  constructor(baseUrl: string, fetchFn?: typeof fetch) {
    this.baseUrl = baseUrl;
    this._fetch = fetchFn ?? globalThis.fetch;
  }

  protected async fetch(url: string, options?: RequestInit): Promise<Response> {
    return this._fetch(url, options);
  }
}
