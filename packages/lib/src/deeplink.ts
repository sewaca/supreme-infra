export const isDeeplink = (deeplink: string) => {
  return deeplink.startsWith('deeplink://');
};
