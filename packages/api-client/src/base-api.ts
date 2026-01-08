export class BaseApi {
  protected readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async fetch(url: string, options?: RequestInit): Promise<Response> {
    console.log('outgoing request started', url);
    return fetch(url, options)
      .then((response) => {
        console.log('outgoing request finished with status', response.status, response.statusText);
        return response;
      })
      .catch((error) => {
        console.error('outgoing request failed with ', error);
        throw error;
      });
  }
}
