export function setCookie(name: string, value: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: setting preference cookie
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}
